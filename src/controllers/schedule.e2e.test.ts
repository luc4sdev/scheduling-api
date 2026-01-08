import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { SchedulesController } from './schedule';

vi.mock('../env', () => ({
    env: {
        JWT_SECRET: 'test-secret',
        DATABASE_URL: 'sqlite::memory:',
        PORT: 3000
    }
}));

vi.mock('../config/database', () => ({
    sequelize: {
        sync: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../services/schedule');
vi.mock('../services/user');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const ROOM_ID = '550e8400-e29b-41d4-a716-446655440002';
const SCHEDULE_ID = '550e8400-e29b-41d4-a716-446655440003';

const mockSchedulesService = {
    getAvailability: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    updateStatus: vi.fn()
};

const mockUsersService = {
    getById: vi.fn()
};

SchedulesController['service'] = mockSchedulesService as any;
SchedulesController['usersService'] = mockUsersService as any;

describe('SchedulesController E2E', () => {
    let app: express.Application;
    let validToken: string;
    let userToken: string;

    beforeEach(() => {
        vi.clearAllMocks();

        app = express();
        app.use(express.json());

        const authMiddleware = (req: any, res: any, next: any) => {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ message: 'Missing authorization header' });
            }

            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, 'test-secret') as any;
                req.userId = decoded.sub;
                next();
            } catch {
                return res.status(401).json({ message: 'Invalid token' });
            }
        };

        app.get('/api/schedules/availability', SchedulesController.getAvailability);
        app.post('/api/schedules', authMiddleware, SchedulesController.create);
        app.get('/api/schedules', authMiddleware, SchedulesController.getAll);
        app.put('/api/schedules/:id', authMiddleware, SchedulesController.updateStatus);

        validToken = jwt.sign(
            { sub: ADMIN_ID, role: 'ADMIN' },
            'test-secret',
            { expiresIn: '1h' }
        );

        userToken = jwt.sign(
            { sub: USER_ID, role: 'USER' },
            'test-secret',
            { expiresIn: '1h' }
        );
    });

    describe('GET /api/schedules/availability - Get Availability', () => {
        it('should return available slots for a room on a specific date', async () => {
            const availableSlots = [
                { startTime: '10:00', endTime: '10:30' },
                { startTime: '10:30', endTime: '11:00' },
                { startTime: '14:00', endTime: '14:30' }
            ];

            mockSchedulesService.getAvailability.mockResolvedValue(availableSlots);

            const response = await request(app)
                .get('/api/schedules/availability')
                .query({
                    date: '2026-01-15',
                    roomId: ROOM_ID
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(3);
            expect(response.body[0]).toHaveProperty('startTime');
        });

        it('should return 400 for invalid date format', async () => {
            const response = await request(app)
                .get('/api/schedules/availability')
                .query({
                    date: 'invalid-date',
                    roomId: ROOM_ID
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation error');
        });

        it('should return 400 for invalid room UUID', async () => {
            const response = await request(app)
                .get('/api/schedules/availability')
                .query({
                    date: '2026-01-15',
                    roomId: 'invalid-uuid'
                });

            expect(response.status).toBe(400);
        });

        it('should return 404 if room not found', async () => {
            mockSchedulesService.getAvailability.mockRejectedValue(
                new Error('Sala não encontrada')
            );

            const response = await request(app)
                .get('/api/schedules/availability')
                .query({
                    date: '2026-01-15',
                    roomId: ROOM_ID
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Sala não encontrada');
        });

        it('should return 400 for missing date parameter', async () => {
            const response = await request(app)
                .get('/api/schedules/availability')
                .query({
                    roomId: ROOM_ID
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/schedules - Create Schedule', () => {
        it('should create a new schedule successfully', async () => {
            const scheduleData = {
                roomId: ROOM_ID,
                date: '2026-01-15',
                startTime: '10:00'
            };

            const mockSchedule = {
                id: SCHEDULE_ID,
                ...scheduleData,
                userId: USER_ID,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockSchedulesService.create.mockResolvedValue(mockSchedule);

            const response = await request(app)
                .post('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`)
                .send(scheduleData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.userId).toBe(USER_ID);
        });

        it('should return 400 for invalid room UUID', async () => {
            const scheduleData = {
                roomId: 'invalid-uuid',
                date: '2026-01-15',
                startTime: '10:00'
            };

            const response = await request(app)
                .post('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`)
                .send(scheduleData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid time format', async () => {
            const scheduleData = {
                roomId: ROOM_ID,
                date: '2026-01-15',
                startTime: 'invalid-time'
            };

            const response = await request(app)
                .post('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`)
                .send(scheduleData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid date format', async () => {
            const scheduleData = {
                roomId: ROOM_ID,
                date: 'invalid-date',
                startTime: '10:00'
            };

            const response = await request(app)
                .post('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`)
                .send(scheduleData);

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const scheduleData = {
                roomId: ROOM_ID,
                date: '2026-01-15',
                startTime: '10:00'
            };

            const response = await request(app)
                .post('/api/schedules')
                .send(scheduleData);

            expect(response.status).toBe(401);
        });

        it('should return 400 if slot is not available', async () => {
            const scheduleData = {
                roomId: ROOM_ID,
                date: '2026-01-15',
                startTime: '10:00'
            };

            mockSchedulesService.create.mockRejectedValue(
                new Error('Horário não disponível')
            );

            const response = await request(app)
                .post('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`)
                .send(scheduleData);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/schedules - List Schedules', () => {
        it('should list schedules with authentication', async () => {
            const mockSchedules = [
                {
                    id: SCHEDULE_ID,
                    roomId: ROOM_ID,
                    userId: USER_ID,
                    date: '2026-01-15',
                    startTime: '10:00',
                    status: 'PENDING'
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440004',
                    roomId: ROOM_ID,
                    userId: USER_ID,
                    date: '2026-01-16',
                    startTime: '14:00',
                    status: 'CONFIRMED'
                }
            ];

            mockSchedulesService.getAll.mockResolvedValue({
                data: mockSchedules,
                total: 2,
                page: 1,
                pageSize: 10
            });

            mockUsersService.getById.mockResolvedValue({
                id: USER_ID,
                role: 'USER'
            });

            const response = await request(app)
                .get('/api/schedules')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/schedules');

            expect(response.status).toBe(401);
        });

        it('should support pagination', async () => {
            mockSchedulesService.getAll.mockResolvedValue({
                data: [],
                total: 0,
                page: 2,
                pageSize: 10
            });

            mockUsersService.getById.mockResolvedValue({
                id: USER_ID,
                role: 'USER'
            });

            const response = await request(app)
                .get('/api/schedules')
                .query({ page: 2, limit: 10 })
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.page).toBe(2);
        });

        it('should filter schedules by room', async () => {
            mockSchedulesService.getAll.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 10
            });

            mockUsersService.getById.mockResolvedValue({
                id: USER_ID,
                role: 'USER'
            });

            const response = await request(app)
                .get('/api/schedules')
                .query({ roomId: ROOM_ID })
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(mockSchedulesService.getAll).toHaveBeenCalledWith(
                expect.objectContaining({ roomId: ROOM_ID })
            );
        });
    });

    describe('PUT /api/schedules/:id - Update Schedule Status', () => {
        it('should update schedule status successfully', async () => {
            const updatedSchedule = {
                id: SCHEDULE_ID,
                roomId: ROOM_ID,
                userId: USER_ID,
                date: '2026-01-15',
                startTime: '10:00',
                status: 'CONFIRMED'
            };

            mockSchedulesService.updateStatus.mockResolvedValue(updatedSchedule);

            const response = await request(app)
                .put(`/api/schedules/${SCHEDULE_ID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('CONFIRMED');
        });

        it('should return 400 for invalid schedule UUID', async () => {
            const response = await request(app)
                .put('/api/schedules/invalid-uuid')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(400);
        });

        it('should return 400 for invalid status', async () => {
            const response = await request(app)
                .put(`/api/schedules/${SCHEDULE_ID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'INVALID_STATUS' });

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .put(`/api/schedules/${SCHEDULE_ID}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(401);
        });

        it('should return 400 if schedule not found', async () => {
            mockSchedulesService.updateStatus.mockRejectedValue(
                new Error('Schedule not found')
            );

            const response = await request(app)
                .put(`/api/schedules/${SCHEDULE_ID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ status: 'CONFIRMED' });

            expect(response.status).toBe(400);
        });
    });
});