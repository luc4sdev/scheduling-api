import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulesService } from './schedule';
import { Schedule } from '../models/Schedule';
import { Room } from '../models/Room';


vi.mock('./log/');

vi.mock('../models/Schedule', () => ({
    Schedule: {
        findAll: vi.fn(),
        findOne: vi.fn(),
        findByPk: vi.fn(),
        findAndCountAll: vi.fn(),
        create: vi.fn(),
    },
    ScheduleStatus: {
        PENDING: 'PENDING',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED'
    }
}));

vi.mock('../models/Room', () => ({
    Room: {
        findByPk: vi.fn(),
    }
}));

vi.mock('../models/User', () => ({
    User: {
        findByPk: vi.fn(),
    }
}));


describe('SchedulesService', () => {
    let service: SchedulesService;
    let logsServiceMock: any;

    beforeEach(() => {
        service = new SchedulesService();
        logsServiceMock = (service as any).logsService;
        vi.restoreAllMocks();
    });

    it('should get availability for a room', async () => {
        const room = { id: '1', startTime: '08:00', endTime: '10:00', slotDuration: 60 };
        vi.mocked(Room.findByPk).mockResolvedValue(room as any);
        vi.mocked(Schedule.findAll).mockResolvedValue([{ startTime: '08:00' }] as any);
        const result = await service.getAvailability('1', '2026-01-08');
        expect(result).toEqual(['09:00']);
    });

    it('should throw error if room not found for availability', async () => {
        vi.mocked(Room.findByPk).mockResolvedValue(null);
        await expect(service.getAvailability('1', '2026-01-08')).rejects.toThrow('Sala não encontrada');
    });

    it('should create a schedule and log creation', async () => {
        const room = { id: '1', slotDuration: 60 };
        vi.mocked(Room.findByPk).mockResolvedValue(room as any);
        vi.mocked(Schedule.findOne).mockResolvedValue(null);
        vi.mocked(Schedule.create).mockResolvedValue({ id: 'sch-1', userId: 'u1', roomId: '1', date: '2026-01-08', startTime: '08:00' } as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);
        const result = await service.create({ userId: 'u1', roomId: '1', date: '2026-01-08', startTime: '08:00' });
        expect(Schedule.create).toHaveBeenCalled();
        expect(logsServiceMock.createLog).toHaveBeenCalled();
        expect(result).toHaveProperty('id', 'sch-1');
    });

    it('should throw error if room not found for create', async () => {
        vi.mocked(Room.findByPk).mockResolvedValue(null);
        await expect(service.create({ userId: 'u1', roomId: '1', date: '2026-01-08', startTime: '08:00' })).rejects.toThrow('Sala não encontrada');
    });

    it('should throw error if slot already reserved', async () => {
        const room = { id: '1', slotDuration: 60 };
        vi.mocked(Room.findByPk).mockResolvedValue(room as any);
        vi.mocked(Schedule.findOne).mockResolvedValue({ id: 'sch-1' } as any);
        await expect(service.create({ userId: 'u1', roomId: '1', date: '2026-01-08', startTime: '08:00' })).rejects.toThrow('Horário já reservado por outro usuário.');
    });

    it('should get all schedules with pagination', async () => {
        vi.mocked(Schedule.findAndCountAll).mockResolvedValue({ count: 2, rows: [{ id: '1' }, { id: '2' }] } as any);
        const result = await service.getAll({ userId: 'u1', isAdmin: false, page: 1, limit: 2 });
        expect(Schedule.findAndCountAll).toHaveBeenCalled();
        expect(result).toEqual({
            data: [{ id: '1' }, { id: '2' }],
            total: 2,
            page: 1,
            totalPages: 1
        });
    });

    it('should update schedule status and log if needed', async () => {
        const schedule = { id: 'sch-1', userId: 'u1', update: vi.fn().mockResolvedValue({ id: 'sch-1', status: 'CANCELLED' }) };
        vi.mocked(Schedule.findByPk).mockResolvedValue(schedule as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);
        const result = await service.updateStatus('sch-1', 'CANCELLED' as any);
        expect(Schedule.findByPk).toHaveBeenCalledWith('sch-1');
        expect(schedule.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
        expect(logsServiceMock.createLog).toHaveBeenCalled();
        expect(result).toEqual(schedule);
    });

    it('should throw error if schedule to update is not found', async () => {
        vi.mocked(Schedule.findByPk).mockResolvedValue(null);
        await expect(service.updateStatus('sch-1', 'CANCELLED' as any)).rejects.toThrow('Agendamento não encontrado');
    });
});
