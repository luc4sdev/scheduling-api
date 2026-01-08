import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { LogsController } from './log';

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

vi.mock('../services/log');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const LOG_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockLogsService = {
    createLog: vi.fn(),
    getAll: vi.fn()
};

LogsController['logsService'] = mockLogsService;

describe('LogsController E2E', () => {
    let app: express.Application;
    let adminToken: string;
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

        app.get('/api/logs', authMiddleware, LogsController.getLogs);

        adminToken = jwt.sign(
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

    describe('GET /api/logs - Get Logs', () => {
        it('should return logs for authenticated admin user', async () => {
            const mockLogs = [
                {
                    id: LOG_ID,
                    userId: USER_ID,
                    action: 'User created',
                    description: 'User john@example.com was created',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440003',
                    userId: USER_ID,
                    action: 'User updated',
                    description: 'User john@example.com was updated',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 2,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        it('should return logs for authenticated regular user', async () => {
            const mockLogs = [
                {
                    id: LOG_ID,
                    userId: USER_ID,
                    action: 'User created',
                    description: 'User john@example.com was created',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 1,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/logs');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Missing authorization header');
        });

        it('should support pagination', async () => {
            const mockLogs = [] as any;

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 0,
                page: 2,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .query({ page: 2, limit: 10 })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.page).toBe(2);
        });

        it('should filter logs with query parameter', async () => {
            const mockLogs = [
                {
                    id: LOG_ID,
                    userId: USER_ID,
                    action: 'User created',
                    description: 'User john@example.com was created',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 1,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .query({ query: 'User' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(mockLogsService.getAll).toHaveBeenCalledWith(
                expect.objectContaining({ query: 'User' })
            );
        });

        it('should filter logs by date', async () => {
            const mockLogs = [] as any;

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 0,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .query({ date: '2026-01-08' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(mockLogsService.getAll).toHaveBeenCalledWith(
                expect.objectContaining({ date: '2026-01-08' })
            );
        });

        it('should support order parameter', async () => {
            const mockLogs = [] as any;

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 0,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .query({ order: 'ASC' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(mockLogsService.getAll).toHaveBeenCalledWith(
                expect.objectContaining({ order: 'ASC' })
            );
        });

        it('should return default DESC order when not specified', async () => {
            const mockLogs = [] as any;

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 0,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(mockLogsService.getAll).toHaveBeenCalledWith(
                expect.objectContaining({ order: 'DESC' })
            );
        });

        it('should return 200 with default page when invalid page parameter provided', async () => {
            const mockLogs = [] as any;

            mockLogsService.getAll.mockResolvedValue({
                data: mockLogs,
                total: 0,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .query({ page: 'invalid-number' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.page).toBe(1);
        });

        it('should return 400 for invalid order parameter', async () => {
            const response = await request(app)
                .get('/api/logs')
                .query({ order: 'INVALID_ORDER' })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation error');
        });

        it('should return 500 for internal server error', async () => {
            mockLogsService.getAll.mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Internal server error');
        });

        it('should return empty logs array when no records found', async () => {
            mockLogsService.getAll.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
            expect(response.body.total).toBe(0);
        });
    });
});
