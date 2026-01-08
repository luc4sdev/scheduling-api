import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoomsService } from './room';
import { Room } from '../models/Room';

vi.mock('./log/');

vi.mock('../models/Room', () => ({
    Room: {
        findAll: vi.fn(),
        bulkCreate: vi.fn(),
        findByPk: vi.fn(),
    }
}));

describe('RoomsService', () => {
    let service: RoomsService;
    let logsServiceMock: any;

    beforeEach(() => {
        service = new RoomsService();
        logsServiceMock = (service as any).logsService;
        vi.restoreAllMocks();
    });

    it('should get all active rooms', async () => {
        vi.mocked(Room.findAll).mockResolvedValue([{ id: '1', isActive: true }] as any);
        const result = await service.getAll();
        expect(Room.findAll).toHaveBeenCalledWith({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
        expect(result).toEqual([{ id: '1', isActive: true }]);
    });

    it('should create rooms and log each creation', async () => {
        const roomsData = [
            { name: 'Room 1', startTime: '08:00', endTime: '18:00', slotDuration: 60 },
            { name: 'Room 2', startTime: '09:00', endTime: '17:00', slotDuration: 30 }
        ];
        const createdRooms = [
            { id: '1', ...roomsData[0] },
            { id: '2', ...roomsData[1] }
        ];
        vi.mocked(Room.bulkCreate).mockResolvedValue(createdRooms as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);
        const result = await service.create(roomsData, 'admin-1');
        expect(Room.bulkCreate).toHaveBeenCalledWith(roomsData);
        expect(logsServiceMock.createLog).toHaveBeenCalledTimes(2);
        expect(result).toEqual(createdRooms);
    });

    it('should update a room and log the update', async () => {
        const room = { id: '1', name: 'Old Name', update: vi.fn().mockResolvedValue({ id: '1', name: 'New Name' }) };
        vi.mocked(Room.findByPk).mockResolvedValue(room as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);
        await service.update('1', { name: 'New Name' }, 'admin-1');
        expect(Room.findByPk).toHaveBeenCalledWith('1');
        expect(logsServiceMock.createLog).toHaveBeenCalledWith(
            'admin-1',
            'Edição de sala',
            'Agendamento',
            expect.objectContaining({ roomId: '1', oldName: 'Old Name' })
        );
    });

    it('should throw error if room to update is not found', async () => {
        vi.mocked(Room.findByPk).mockResolvedValue(null);
        await expect(service.update('1', { name: 'New Name' }, 'admin-1')).rejects.toThrow('Sala não encontrada');
    });

    it('should deactivate a room and log the deletion', async () => {
        const room = { id: '1', name: 'Room 1', update: vi.fn().mockResolvedValue({ id: '1', isActive: false }) };
        vi.mocked(Room.findByPk).mockResolvedValue(room as any);
        logsServiceMock.createLog.mockResolvedValue(undefined);
        const result = await service.delete('1', 'admin-1');
        expect(Room.findByPk).toHaveBeenCalledWith('1');
        expect(room.update).toHaveBeenCalledWith({ isActive: false });
        expect(logsServiceMock.createLog).toHaveBeenCalledWith(
            'admin-1',
            'Desativação de sala',
            'Agendamento',
            { roomId: '1', roomName: 'Room 1' }
        );
        expect(result).toEqual(room);
    });

    it('should throw error if room to delete is not found', async () => {
        vi.mocked(Room.findByPk).mockResolvedValue(null);
        await expect(service.delete('1', 'admin-1')).rejects.toThrow('Sala não encontrada');
    });

    it('should get room by id', async () => {
        vi.mocked(Room.findByPk).mockResolvedValue({ id: '1', name: 'Room 1' } as any);
        const result = await service.getById('1');
        expect(Room.findByPk).toHaveBeenCalledWith('1');
        expect(result).toEqual({ id: '1', name: 'Room 1' });
    });
});
