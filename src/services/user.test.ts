import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './user';
import { User } from '../models/User';
import { Log } from '../models/Log';
import { Schedule } from '../models/Schedule';
import { Op } from 'sequelize';

vi.mock('../models/User', () => ({
    User: {
        findOne: vi.fn(),
        findByPk: vi.fn(),
        findAndCountAll: vi.fn(),
        create: vi.fn(),
        destroy: vi.fn(),
    }
}));

vi.mock('../models/Log', () => ({
    Log: {
        destroy: vi.fn(),
    }
}));

vi.mock('../models/Schedule', () => ({
    Schedule: {
        destroy: vi.fn(),
    }
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn(),
    }
}));

vi.mock('date-fns', async (importOriginal) => {
    const actual = await importOriginal<typeof import('date-fns')>();
    return {
        ...actual,
        startOfDay: actual.startOfDay,
        endOfDay: actual.endOfDay,
        parseISO: actual.parseISO,
    };
});

vi.mock('./log');

describe('UsersService', () => {
    let service: UsersService;
    let logsServiceMock: any;

    beforeEach(() => {
        service = new UsersService();
        logsServiceMock = (service as any).logsService;
        vi.restoreAllMocks();
    });

    it('should get all users with pagination', async () => {
        vi.mocked(User.findAndCountAll).mockResolvedValue({
            count: 2,
            rows: [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }] as any
        } as any);

        const result = await service.getAll({ page: 1, limit: 2 });

        expect(User.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual({
            data: [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }],
            total: 2,
            page: 1,
            totalPages: 1
        });
    });

    it('should apply text search filter on getAll', async () => {
        vi.mocked(User.findAndCountAll).mockResolvedValue({ count: 0, rows: [] } as any);

        const query = 'john';
        await service.getAll({ page: 1, limit: 10, query });

        expect(User.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                [Op.or]: expect.any(Array)
            })
        }));
    });

    it('should apply date filter on getAll', async () => {
        vi.mocked(User.findAndCountAll).mockResolvedValue({ count: 0, rows: [] } as any);

        const dateString = '2026-01-08';
        await service.getAll({ page: 1, limit: 10, date: dateString });

        expect(User.findAndCountAll).toHaveBeenCalled();
        const callArgs = vi.mocked(User.findAndCountAll).mock.calls[0][0];
        const whereClause = callArgs?.where as any;

        expect(whereClause.role).toBe('USER');
    });

    it('should get user by id without password', async () => {
        vi.mocked(User.findByPk).mockResolvedValue({ id: '1', name: 'User 1' } as any);

        const result = await service.getById('1');

        expect(User.findByPk).toHaveBeenCalledWith('1', expect.objectContaining({
            attributes: expect.objectContaining({})
        }));
        expect(result).toEqual({ id: '1', name: 'User 1' });
    });

    it('should get user by email', async () => {
        vi.mocked(User.findOne).mockResolvedValue({ id: '1', email: 'user@email.com' } as any);

        const result = await service.getByEmail('user@email.com');

        expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'user@email.com' } });
        expect(result).toEqual({ id: '1', email: 'user@email.com' });
    });

    it('should create user with hashed password and log creation', async () => {
        const userData = {
            name: 'John',
            lastName: 'Doe',
            email: 'john@email.com',
            password: 'password123',
            cep: '12345-678',
            street: 'Main Street',
            number: '123',
            complement: 'Apt 1',
            neighborhood: 'Downtown',
            city: 'City',
            state: 'ST',
            role: 'USER' as const
        };

        const { default: bcrypt } = await import('bcryptjs');
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as any);

        const createdUser = {
            id: 'user-1',
            ...userData,
            password: 'hashed-password',
            toJSON: vi.fn().mockReturnValue({
                id: 'user-1',
                ...userData,
                password: 'hashed-password'
            })
        };

        vi.mocked(User.create).mockResolvedValue(createdUser as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);

        const result = await service.create(userData);

        expect(User.create).toHaveBeenCalled();
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        expect(logsServiceMock.createLog).toHaveBeenCalled();
        expect(result).not.toHaveProperty('password');
    });

    it('should update user and log email change', async () => {
        const user = {
            id: 'user-1',
            email: 'old@email.com',
            update: vi.fn().mockResolvedValue({
                id: 'user-1',
                email: 'new@email.com',
                toJSON: vi.fn().mockReturnValue({ id: 'user-1', email: 'new@email.com' })
            }),
            toJSON: vi.fn().mockReturnValue({ id: 'user-1', email: 'new@email.com' })
        };

        vi.mocked(User.findByPk).mockResolvedValue(user as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);

        const result = await service.update('user-1', { email: 'new@email.com' });

        expect(User.findByPk).toHaveBeenCalledWith('user-1');
        expect(logsServiceMock.createLog).toHaveBeenCalledWith(
            'user-1',
            'Atualização de e-mail',
            'Minha Conta'
        );
        expect(result).not.toHaveProperty('password');
    });

    it('should update user and log data change', async () => {
        const user = {
            id: 'user-1',
            email: 'user@email.com',
            update: vi.fn().mockResolvedValue({
                id: 'user-1',
                email: 'user@email.com',
                name: 'Jane',
                toJSON: vi.fn().mockReturnValue({ id: 'user-1', email: 'user@email.com', name: 'Jane' })
            }),
            toJSON: vi.fn().mockReturnValue({ id: 'user-1', email: 'user@email.com', name: 'Jane' })
        };

        vi.mocked(User.findByPk).mockResolvedValue(user as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);

        const result = await service.update('user-1', { name: 'Jane' });

        expect(logsServiceMock.createLog).toHaveBeenCalledWith(
            'user-1',
            'Atualização de dados cadastrais',
            'Minha Conta'
        );
        expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user to update is not found', async () => {
        vi.mocked(User.findByPk).mockResolvedValue(null);

        await expect(service.update('user-1', { name: 'Jane' })).rejects.toThrow('User not found');
    });

    it('should delete user and all related data', async () => {
        vi.mocked(Log.destroy).mockResolvedValue(2);
        vi.mocked(Schedule.destroy).mockResolvedValue(3);
        vi.mocked(User.destroy).mockResolvedValue(1);

        const result = await service.delete('user-1');

        expect(Log.destroy).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
        expect(Schedule.destroy).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
        expect(User.destroy).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        expect(result).toBe(true);
    });

    it('should return false when deleting non-existent user', async () => {
        vi.mocked(Log.destroy).mockResolvedValue(0);
        vi.mocked(Schedule.destroy).mockResolvedValue(0);
        vi.mocked(User.destroy).mockResolvedValue(0);

        const result = await service.delete('nonexistent-id');

        expect(result).toBe(false);
    });

    it('should create default admin user if not exists', async () => {
        vi.mocked(User.findOne).mockResolvedValue(null);

        const { default: bcrypt } = await import('bcryptjs');
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed-admin-password' as any);

        const adminUser = {
            id: 'admin-1',
            name: 'Admin',
            lastName: 'User',
            email: 'admin@email.com',
            role: 'ADMIN',
            password: 'hashed-admin-password',
            toJSON: vi.fn().mockReturnValue({
                id: 'admin-1',
                name: 'Admin',
                lastName: 'User',
                email: 'admin@email.com',
                role: 'ADMIN',
                password: 'hashed-admin-password'
            })
        };

        vi.mocked(User.create).mockResolvedValue(adminUser as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);

        const result = await service.createDefaultAdminUser();

        expect(User.create).toHaveBeenCalled();
        expect(logsServiceMock.createLog).toHaveBeenCalled();
        expect(result).not.toHaveProperty('password');
    });

    it('should return existing admin user', async () => {
        const existingAdmin = { id: 'admin-1', email: 'admin@email.com', role: 'ADMIN' };
        vi.mocked(User.findOne).mockResolvedValue(existingAdmin as any);

        vi.clearAllMocks();
        vi.mocked(User.findOne).mockResolvedValue(existingAdmin as any);
        const result = await service.createDefaultAdminUser();

        expect(User.create).not.toHaveBeenCalled();
        expect(result).toEqual(existingAdmin);
    });
});
