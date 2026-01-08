import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './auth';

vi.mock('../env', () => ({
    env: {
        JWT_SECRET: 'test-secret'
    }
}));

describe('authMiddleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        jsonMock = vi.fn().mockReturnValue(undefined);
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        next = vi.fn();

        req = {
            headers: {}
        };

        res = {
            status: statusMock
        };
    });

    describe('Valid Token', () => {
        it('should set userId and call next() when token is valid', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret', { expiresIn: '1h' });

            req.headers = {
                authorization: `Bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(req.userId).toBe(userId);
            expect(next).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should decode JWT and extract sub claim correctly', () => {
            const userId = 'test-user-123';
            const token = jwt.sign({ sub: userId, role: 'ADMIN' }, 'test-secret');

            req.headers = {
                authorization: `Bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(req.userId).toBe(userId);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('Invalid Token', () => {
        it('should return 401 when token is invalid', () => {
            req.headers = {
                authorization: 'Bearer invalid-token-xyz'
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is signed with wrong secret', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const wrongToken = jwt.sign({ sub: userId }, 'wrong-secret', { expiresIn: '1h' });

            req.headers = {
                authorization: `Bearer ${wrongToken}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is malformed', () => {
            req.headers = {
                authorization: 'Bearer not.a.valid.token'
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Missing Token', () => {
        it('should return 401 when authorization header is missing', () => {
            req.headers = {};

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token not provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header is empty string', () => {
            req.headers = {
                authorization: ''
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when authorization header is null', () => {
            req.headers = {
                authorization: null as any
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Token Format', () => {
        it('should return 401 when token format is invalid (missing Bearer prefix)', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: token
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token format invalid' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when only Bearer prefix is provided without token', () => {
            req.headers = {
                authorization: 'Bearer '
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token format invalid' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should accept Bearer with any case', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);
            expect(req.userId).toBe(userId);
            expect(next).toHaveBeenCalled();
        });

        it('should handle multiple spaces in authorization header', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `Bearer  ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('Return Values', () => {
        it('should return undefined when token is valid', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `Bearer ${token}`
            };

            const result = authMiddleware(req as Request, res as Response, next);

            expect(result).toBeUndefined();
            expect(next).toHaveBeenCalled();
        });

        it('should return the result of res.status().json() when error occurs', () => {
            const returnValue = { result: 'called' };
            jsonMock.mockReturnValue(returnValue);

            req.headers = {
                authorization: ''
            };

            const result = authMiddleware(req as Request, res as Response, next);

            expect(result).toBe(returnValue);
        });
    });

    describe('Global Express Declaration', () => {
        it('should set userId as string type in request', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `Bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(typeof req.userId).toBe('string');
            expect(req.userId).toBe(userId);
        });
    });

    describe('Security', () => {
        it('should not expose sensitive information in error messages', () => {
            const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload';

            req.headers = {
                authorization: `Bearer ${invalidToken}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
            const callArgs = jsonMock.mock.calls[0][0];
            expect(JSON.stringify(callArgs)).not.toContain(invalidToken);
        });

        it('should not call next() when authentication fails', () => {
            req.headers = {
                authorization: 'Bearer invalid'
            };

            authMiddleware(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
        });

        it('should handle malformed JWT gracefully', () => {
            req.headers = {
                authorization: 'Bearer not.a.token'
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
        });
    });

    describe('Edge Cases', () => {
        it('should handle token with special characters', () => {
            const userId = 'user-with-special-chars_123';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `Bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(req.userId).toBe(userId);
            expect(next).toHaveBeenCalled();
        });

        it('should handle very long token', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const payload = { sub: userId, data: 'x'.repeat(1000) };
            const token = jwt.sign(payload, 'test-secret');

            req.headers = {
                authorization: `Bearer ${token}`
            };

            authMiddleware(req as Request, res as Response, next);

            expect(req.userId).toBe(userId);
            expect(next).toHaveBeenCalled();
        });

        it('should handle authorization header with extra spaces', () => {
            const userId = '550e8400-e29b-41d4-a716-446655440000';
            const token = jwt.sign({ sub: userId }, 'test-secret');

            req.headers = {
                authorization: `  Bearer ${token}  `
            };

            authMiddleware(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(401);
        });
    });
});
