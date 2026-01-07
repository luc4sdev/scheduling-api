import { Op } from 'sequelize';
import { Schedule, ScheduleStatus } from '../models/Schedule';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { startOfDay, endOfDay, parseISO, format, addMinutes, setHours, setMinutes } from 'date-fns';
import { LogsService } from './log';

interface CreateScheduleDTO {
    userId: string;
    roomId: string;
    date: string;
}

interface ListFilter {
    userId?: string;
    isAdmin: boolean;
    page: number;
    limit: number;
    query?: string;
    roomId?: string;
    date?: string;
}

export class SchedulesService {

    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    public async getAvailableSlots(roomId: string, dateString: string) {
        const room = await Room.findByPk(roomId);
        if (!room) throw new Error('Sala não encontrada');

        const [startHour, startMinute] = room.startTime.split(':').map(Number);
        const [endHour, endMinute] = room.endTime.split(':').map(Number);

        const queryDate = parseISO(dateString);

        const existingSchedules = await Schedule.findAll({
            where: {
                roomId,
                status: { [Op.ne]: ScheduleStatus.CANCELLED },
                date: {
                    [Op.between]: [startOfDay(queryDate), endOfDay(queryDate)]
                }
            }
        });

        const occupiedTimes = new Set(existingSchedules.map(s => format(s.date, 'HH:mm')));

        const slots: string[] = [];

        let currentTime = setMinutes(setHours(queryDate, startHour), startMinute);

        const endTime = setMinutes(setHours(queryDate, endHour), endMinute);

        while (currentTime < endTime) {
            const timeString = format(currentTime, 'HH:mm');

            if (!occupiedTimes.has(timeString)) {
                slots.push(timeString);
            }

            currentTime = addMinutes(currentTime, room.slotDuration);
        }

        return slots;
    }

    public async create({ userId, roomId, date }: CreateScheduleDTO) {
        const existing = await Schedule.findOne({
            where: {
                roomId,
                date: parseISO(date),
                status: { [Op.ne]: ScheduleStatus.CANCELLED }
            }
        });

        if (existing) {
            throw new Error('Horário já reservado por outro usuário.');
        }

        const schedule = await Schedule.create({
            userId,
            roomId,
            date: parseISO(date),
            status: ScheduleStatus.PENDING
        });

        await this.logsService.createLog(
            userId,
            'Criação de agendamento',
            'Agendamento',
            { scheduleId: schedule.id, date }
        );
    }

    public async getAll({ userId, isAdmin, page, limit, query, roomId, date }: ListFilter) {
        const offset = (page - 1) * limit;
        const where: any = {};
        const userWhere: any = {};

        if (!isAdmin && userId) {
            where.userId = userId;
        }

        if (roomId) where.roomId = roomId;

        if (date) {
            const parsedDate = parseISO(date);
            where.date = {
                [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
            };
        }

        if (query) {
            userWhere[Op.or] = [
                { name: { [Op.like]: `%${query}%` } },
                { lastName: { [Op.like]: `%${query}%` } },
                { email: { [Op.like]: `%${query}%` } }
            ];
        }

        const { count, rows } = await Schedule.findAndCountAll({
            where,
            limit,
            offset,
            order: [['date', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'lastName', 'email', 'role'],
                    where: userWhere,
                    required: true
                },
                {
                    model: Room,
                    attributes: ['id', 'name']
                }
            ],
            distinct: true
        });

        return {
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    public async updateStatus(id: string, status: ScheduleStatus) {
        const schedule = await Schedule.findByPk(id);
        if (!schedule) throw new Error('Agendamento não encontrado');

        await schedule.update({ status });

        if (status === ScheduleStatus.CANCELLED) {
            await this.logsService.createLog(
                schedule.userId,
                'Cancelamento de agendamento',
                'Agendamento',
                { scheduleId: schedule.id }
            );
        }

        return schedule;
    }
}