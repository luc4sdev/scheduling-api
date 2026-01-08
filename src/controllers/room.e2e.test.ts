import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { RoomsController } from './room';

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

vi.mock('../services/room');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const ROOM_ID = '550e8400-e29b-41d4-a716-446655440001';

const mockRoomsService = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
};

RoomsController['roomsService'] = mockRoomsService as any;

describe('RoomsController E2E', () => {
    let app: express.Application;
    let adminToken: string;

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

        app.get('/api/rooms', RoomsController.getAll);
        app.post('/api/rooms', authMiddleware, RoomsController.create);
        app.put('/api/rooms/:id', authMiddleware, RoomsController.update);
        app.delete('/api/rooms/:id', authMiddleware, RoomsController.delete);

        adminToken = jwt.sign(
            { sub: ADMIN_ID, role: 'ADMIN' },
            'test-secret',
            { expiresIn: '1h' }
        );
    });

    describe('GET /api/rooms - List Rooms', () => {
        it('should return all rooms', async () => {
            const mockRooms = [
                {
                    id: ROOM_ID,
                    name: 'Conference Room A',
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDuration: 30,
                    isActive: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    name: 'Conference Room B',
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDuration: 30,
                    isActive: true
                }
            ];

            mockRoomsService.getAll.mockResolvedValue(mockRooms);

            const response = await request(app)
                .get('/api/rooms');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('name');
        });

        it('should return empty array when no rooms exist', async () => {
            mockRoomsService.getAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/rooms');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });
    });

    describe('POST /api/rooms - Create Rooms', () => {
        it('should create multiple rooms successfully', async () => {
            const roomsData = [
                {
                    name: 'Conference Room A',
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDuration: 30
                },
                {
                    name: 'Conference Room B',
                    startTime: '09:00',
                    endTime: '17:00',
                    slotDuration: 60
                }
            ];

            const mockCreatedRooms = [
                {
                    id: ROOM_ID,
                    ...roomsData[0],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    ...roomsData[1],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockRoomsService.create.mockResolvedValue(mockCreatedRooms);

            const response = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roomsData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('id');
        });

        it('should return 400 for invalid time format', async () => {
            const roomsData = [
                {
                    name: 'Conference Room A',
                    startTime: 'invalid-time',
                    endTime: '18:00',
                    slotDuration: 30
                }
            ];

            const response = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roomsData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation error');
        });

        it('should return 400 for invalid slot duration', async () => {
            const roomsData = [
                {
                    name: 'Conference Room A',
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDuration: 10
                }
            ];

            const response = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roomsData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for missing required fields', async () => {
            const roomsData = [
                {
                    name: 'Conference Room A'
                }
            ];

            const response = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(roomsData);

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const roomsData = [
                {
                    name: 'Conference Room A',
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDuration: 30
                }
            ];

            const response = await request(app)
                .post('/api/rooms')
                .send(roomsData);

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/rooms/:id - Update Room', () => {
        it('should update room successfully', async () => {
            const updateData = {
                name: 'Updated Conference Room A',
                startTime: '07:00',
                endTime: '19:00'
            };

            const mockUpdatedRoom = {
                id: ROOM_ID,
                ...updateData,
                slotDuration: 30,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRoomsService.update.mockResolvedValue(mockUpdatedRoom);

            const response = await request(app)
                .put(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Conference Room A');
        });

        it('should return 400 for invalid room UUID', async () => {
            const updateData = {
                name: 'Updated Room'
            };

            const response = await request(app)
                .put('/api/rooms/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should return 404 if room not found', async () => {
            const updateData = {
                name: 'Updated Room'
            };

            mockRoomsService.update.mockRejectedValue(
                new Error('Sala não encontrada')
            );

            const response = await request(app)
                .put(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Sala não encontrada');
        });

        it('should return 400 for invalid time format in update', async () => {
            const updateData = {
                startTime: 'invalid-time'
            };

            const response = await request(app)
                .put(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const updateData = {
                name: 'Updated Room'
            };

            const response = await request(app)
                .put(`/api/rooms/${ROOM_ID}`)
                .send(updateData);

            expect(response.status).toBe(401);
        });

        it('should support partial updates', async () => {
            const updateData = {
                isActive: false
            };

            const mockUpdatedRoom = {
                id: ROOM_ID,
                name: 'Conference Room A',
                startTime: '08:00',
                endTime: '18:00',
                slotDuration: 30,
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockRoomsService.update.mockResolvedValue(mockUpdatedRoom);

            const response = await request(app)
                .put(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.isActive).toBe(false);
        });
    });

    describe('DELETE /api/rooms/:id - Delete Room', () => {
        it('should delete room successfully', async () => {
            mockRoomsService.delete.mockResolvedValue(undefined);

            const response = await request(app)
                .delete(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(204);
        });

        it('should return 400 for invalid room UUID', async () => {
            const response = await request(app)
                .delete('/api/rooms/invalid-uuid')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
        });

        it('should return 404 if room not found', async () => {
            mockRoomsService.delete.mockRejectedValue(
                new Error('Sala não encontrada')
            );

            const response = await request(app)
                .delete(`/api/rooms/${ROOM_ID}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Sala não encontrada');
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .delete(`/api/rooms/${ROOM_ID}`);

            expect(response.status).toBe(401);
        });
    });
});
