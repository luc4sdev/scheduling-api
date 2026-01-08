import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogsService } from './log';
import { Log } from '../models/Log';
import { User } from '../models/User';
import { Op } from 'sequelize';

vi.mock('../models/Log', () => ({
    Log: {
        create: vi.fn(),
        findAndCountAll: vi.fn(),
    }
}));

vi.mock('../models/User', () => ({
    User: {
        findByPk: vi.fn(),
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

describe('LogsService', () => {
    let service: LogsService;

    beforeEach(() => {
        service = new LogsService();
        vi.restoreAllMocks();
    });

    describe('createLog', () => {
        it('should create a log correctly', async () => {
            const mockLogData = {
                userId: 'user-123',
                action: 'LOGIN',
                module: 'AUTH',
                details: { ip: '127.0.0.1' }
            };
            vi.mocked(Log.create).mockResolvedValue({ id: 'log-1', ...mockLogData } as any);
            const result = await service.createLog(
                mockLogData.userId,
                mockLogData.action,
                mockLogData.module,
                mockLogData.details
            );
            expect(Log.create).toHaveBeenCalledWith(mockLogData);
            expect(result).toHaveProperty('id', 'log-1');
        });
    });

    describe('getAll', () => {
        it('should throw error if requesting user is not found', async () => {
            vi.mocked(User.findByPk).mockResolvedValue(null);
            await expect(service.getAll({ requestingUserId: 'invalid-id' }))
                .rejects
                .toThrow('User not found');
        });
        it('should list ONLY own logs if user is NOT ADMIN', async () => {
            const userId = 'user-123';
            vi.mocked(User.findByPk).mockResolvedValue({
                id: userId,
                role: 'USER'
            } as any);
            vi.mocked(Log.findAndCountAll).mockResolvedValue({ count: 0, rows: [] } as any);
            await service.getAll({ requestingUserId: userId });
            expect(Log.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    userId: userId
                })
            }));
        });

        it('should apply text search filters (query)', async () => {
            vi.mocked(User.findByPk).mockResolvedValue({ id: '1', role: 'ADMIN' } as any);
            vi.mocked(Log.findAndCountAll).mockResolvedValue({ count: 0, rows: [] } as any);
            const query = 'delete';
            await service.getAll({ requestingUserId: '1', query });
            expect(Log.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    [Op.or]: [
                        { action: { [Op.like]: `%${query}%` } },
                        { module: { [Op.like]: `%${query}%` } }
                    ]
                })
            }));
        });

        it('should return paginated data correctly', async () => {
            vi.mocked(User.findByPk).mockResolvedValue({ id: '1', role: 'ADMIN' } as any);
            vi.mocked(Log.findAndCountAll).mockResolvedValue({
                count: 15,
                rows: [{ id: '1' }] as any
            } as any);
            const result = await service.getAll({ requestingUserId: '1', page: 1, limit: 10 });
            expect(result).toEqual({
                data: [{ id: '1' }],
                total: 15,
                page: 1,
                totalPages: 2
            });
            expect(Log.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                limit: 10,
                offset: 0
            }));
        });
    });
});