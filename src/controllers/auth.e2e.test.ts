import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { AuthController } from './auth';

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

vi.mock('../services/auth');

const mockAuthService = {
    authenticate: vi.fn()
};

AuthController['authService'] = mockAuthService as any;

describe('AuthController E2E', () => {
    let app: express.Application;

    beforeEach(() => {
        vi.clearAllMocks();

        app = express();
        app.use(express.json());

        app.post('/api/auth/login', AuthController.authenticate);
    });

    describe('POST /api/auth/login - Authenticate User', () => {
        it('should authenticate user successfully with valid credentials', async () => {
            const loginData = {
                email: 'admin@example.com',
                password: 'Password123'
            };

            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJyb2xlIjoiQURNSU4ifQ.test';

            mockAuthService.authenticate.mockResolvedValue({
                token: mockToken
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Authenticated');
            expect(response.headers['set-cookie']).toBeDefined();
            expect(mockAuthService.authenticate).toHaveBeenCalledWith({
                email: loginData.email,
                password: loginData.password
            });
        });

        it('should return 400 for invalid email format', async () => {
            const loginData = {
                email: 'invalid-email',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation error');
        });

        it('should return 400 for missing password', async () => {
            const loginData = {
                email: 'admin@example.com'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Validation error');
        });

        it('should return 400 for invalid credentials', async () => {
            const loginData = {
                email: 'admin@example.com',
                password: 'WrongPassword123'
            };

            mockAuthService.authenticate.mockRejectedValue(
                new Error('Invalid credentials')
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid credentials!');
        });

        it('should return 500 for internal server error', async () => {
            const loginData = {
                email: 'admin@example.com',
                password: 'Password123'
            };

            mockAuthService.authenticate.mockRejectedValue(
                new Error('Database connection failed')
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Internal server error');
        });

        it('should return 400 for missing email', async () => {
            const loginData = {
                password: 'Password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
        });

        it('should return 400 for empty email', async () => {
            const loginData = {
                email: '',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
        });
    });
});
