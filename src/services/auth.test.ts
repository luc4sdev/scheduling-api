import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth';
import { User } from '../models/User';

vi.mock('../env', () => ({
    env: {
        JWT_SECRET: 'test-secret'
    }
}));

vi.mock('../models/User', () => ({
    User: {
        findOne: vi.fn(),
    }
}));

vi.mock('bcryptjs', () => ({
    compare: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
    }
}));

vi.mock('./log');

describe('AuthService', () => {
    let service: AuthService;
    let logsServiceMock: any;

    beforeEach(() => {
        service = new AuthService();
        logsServiceMock = (service as any).logsService;
        vi.restoreAllMocks();
    });

    it('should authenticate user with valid credentials', async () => {
        const mockUser = { id: 'user-1', email: 'user@email.com', password: 'hashed-password' };
        const mockToken = 'jwt-token-123';

        vi.mocked(User.findOne).mockResolvedValue(mockUser as any);
        const { compare } = await import('bcryptjs');
        const { default: jwt } = await import('jsonwebtoken');

        vi.mocked(compare).mockResolvedValue(true as any);
        vi.mocked(jwt.sign).mockReturnValue(mockToken as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);

        const result = await service.authenticate({ email: 'user@email.com', password: 'password123' });

        expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'user@email.com' } });
        expect(compare).toHaveBeenCalledWith('password123', 'hashed-password');
        expect(jwt.sign).toHaveBeenCalled();
        expect(logsServiceMock.createLog).toHaveBeenCalledWith('user-1', 'Login', 'Minha Conta');
        expect(result).toEqual({ token: mockToken });
    });

    it('should throw error if user not found', async () => {
        vi.mocked(User.findOne).mockResolvedValue(null);

        await expect(service.authenticate({ email: 'nonexistent@email.com', password: 'password' })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
        const mockUser = { id: 'user-1', email: 'user@email.com', password: 'hashed-password' };
        vi.mocked(User.findOne).mockResolvedValue(mockUser as any);

        const { compare } = await import('bcryptjs');
        vi.mocked(compare).mockResolvedValue(false as any);

        await expect(service.authenticate({ email: 'user@email.com', password: 'wrongpassword' })).rejects.toThrow('Invalid credentials');
    });
});
