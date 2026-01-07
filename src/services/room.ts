import { Room, RoomAttributes } from '../models/Room';
import { LogsService } from './log';

export class RoomsService {
    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    public async getAll() {
        return Room.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
    }

    public async create(data: Pick<RoomAttributes, 'name' | 'startTime' | 'endTime' | 'slotDuration'>[], adminId: string) {
        const rooms = await Room.bulkCreate(data);

        await Promise.all(rooms.map(room => {
            return this.logsService.createLog(
                adminId,
                'Criação de sala',
                'Agendamento',
                { roomName: room.name, roomId: room.id }
            );
        }));
        return rooms;
    }

    public async update(id: string, data: Partial<RoomAttributes>, adminId: string) {
        const room = await Room.findByPk(id);
        if (!room) throw new Error('Sala não encontrada');

        const oldName = room.name;
        await room.update(data);

        await this.logsService.createLog(
            adminId,
            'Edição de sala',
            'Agendamento',
            { roomId: id, oldName, newName: room.name }
        );
        return room.update(data);
    }

    public async delete(id: string, adminId: string) {
        const room = await Room.findByPk(id);
        if (!room) throw new Error('Sala não encontrada');
        await room.update({ isActive: false });

        await this.logsService.createLog(
            adminId,
            'Desativação de sala',
            'Agendamento',
            { roomId: id, roomName: room.name }
        );

        return room;
    }

    public async getById(id: string) {
        return Room.findByPk(id);
    }
}