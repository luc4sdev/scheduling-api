import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../services/user');
vi.mock('../models/User');

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { UsersController } from './user';

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';

const mockUsersService = {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createDefaultAdminUser: vi.fn(),
    logsService: {
        createLog: vi.fn(),
        getAll: vi.fn()
    }
};

UsersController['usersService'] = mockUsersService as any;

describe('UsersController E2E', () => {
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
                req.userRole = decoded.role;
                next();
            } catch {
                return res.status(401).json({ message: 'Invalid token' });
            }
        };

        app.post('/api/users', UsersController.create);
        app.use(authMiddleware);
        app.get('/api/me', UsersController.me);
        app.get('/api/users', UsersController.getAll);
        app.get('/api/users/:id', UsersController.getOne);
        app.put('/api/users/:id', UsersController.update);
        app.delete('/api/users/:id', UsersController.delete);

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

    describe('POST /api/users - Create User', () => {
        it('should create a new user successfully', async () => {
            const newUserData = {
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'Password123',
                cep: '12345678',
                street: 'Main St',
                number: '123',
                complement: '',
                neighborhood: 'Center',
                city: 'City',
                state: 'ST'
            };

            const mockUser = { id: USER_ID, ...newUserData, role: 'USER', createdAt: new Date(), updatedAt: new Date() };
            mockUsersService.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/users')
                .send(newUserData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(newUserData.email);
        });

        it('should return 400 for invalid email format', async () => {
            const invalidUserData = {
                name: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                password: 'Password123',
                cep: '12345678',
                street: 'Main St',
                number: '123',
                complement: '',
                neighborhood: 'Center',
                city: 'City',
                state: 'ST'
            };

            const response = await request(app)
                .post('/api/users')
                .send(invalidUserData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for short password', async () => {
            const invalidUserData = {
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'short',
                cep: '12345678',
                street: 'Main St',
                number: '123',
                complement: '',
                neighborhood: 'Center',
                city: 'City',
                state: 'ST'
            };

            const response = await request(app)
                .post('/api/users')
                .send(invalidUserData);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/users - List Users', () => {
        it('should list all users with authentication', async () => {
            const mockUsers = [
                { id: USER_ID, name: 'User', lastName: '1', email: 'user1@example.com', role: 'USER' },
                { id: OTHER_USER_ID, name: 'User', lastName: '2', email: 'user2@example.com', role: 'USER' }
            ];

            mockUsersService.getAll.mockResolvedValue({
                data: mockUsers,
                total: 2,
                page: 1,
                pageSize: 10
            });

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/users');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/users/:id - Get User by ID', () => {
        it('should return user by id', async () => {
            const mockUser = {
                id: USER_ID,
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                role: 'USER'
            };

            mockUsersService.getById.mockResolvedValue(mockUser);

            const response = await request(app)
                .get(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('john@example.com');
        });

        it('should return 404 if user not found', async () => {
            mockUsersService.getById.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid UUID format', async () => {
            const response = await request(app)
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/me - Get Current User', () => {
        it('should return current authenticated user', async () => {
            const mockUser = {
                id: ADMIN_ID,
                name: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                role: 'ADMIN'
            };

            mockUsersService.getById.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.role).toBe('ADMIN');
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/me');

            expect(response.status).toBe(401);
        });

        it('should return 404 if user not found', async () => {
            mockUsersService.getById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/users/:id - Update User', () => {
        it('should update user data', async () => {
            const existingUser = {
                id: USER_ID,
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                role: 'USER'
            };

            const mockUpdatedUser = {
                id: USER_ID,
                name: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                role: 'USER'
            };

            mockUsersService.getById.mockResolvedValueOnce(existingUser);
            mockUsersService.getById.mockResolvedValueOnce(existingUser);
            mockUsersService.update.mockResolvedValueOnce(mockUpdatedUser);

            const response = await request(app)
                .put(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Jane' });

            expect(response.status).toBe(200);
        });

        it('should return 404 if user not found', async () => {
            mockUsersService.getById.mockResolvedValueOnce(null);

            const response = await request(app)
                .put(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Jane' });

            expect(response.status).toBe(404);
        });

        it('should return 403 for unauthorized update', async () => {
            const adminUser = {
                id: ADMIN_ID,
                name: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                role: 'ADMIN'
            };

            const otherUser = {
                id: OTHER_USER_ID,
                name: 'Other',
                lastName: 'User',
                email: 'other@example.com',
                role: 'USER'
            };

            const regularUser = {
                id: USER_ID,
                name: 'User',
                lastName: 'User',
                email: 'user@example.com',
                role: 'USER'
            };

            mockUsersService.getById.mockResolvedValueOnce(otherUser);
            mockUsersService.getById.mockResolvedValueOnce(regularUser);

            const response = await request(app)
                .put(`/api/users/${OTHER_USER_ID}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Hacked' });

            expect(response.status).toBe(403);
        });

        it('should return 400 for invalid data', async () => {
            const response = await request(app)
                .put(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'A' });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /api/users/:id - Delete User', () => {
        it('should delete user successfully', async () => {
            mockUsersService.delete.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 if user not found', async () => {
            mockUsersService.delete.mockResolvedValue(false);

            const response = await request(app)
                .delete(`/api/users/${USER_ID}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid UUID', async () => {
            const response = await request(app)
                .delete('/api/users/invalid-id')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .delete(`/api/users/${USER_ID}`);

            expect(response.status).toBe(401);
        });
    });
});
