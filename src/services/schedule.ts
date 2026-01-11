import { Op, WhereOptions } from 'sequelize';
import { Schedule, ScheduleStatus } from '../models/Schedule';
import { Room } from '../models/Room';
import { User } from '../models/User';
import { LogsService } from './log';
import { statusMap } from '../utils/translate-status';
import { MailService } from './mail';

interface CreateScheduleDTO {
    userId: string;
    roomId: string;
    date: string;
    startTime: string;
}

interface ListFilter {
    userId?: string;
    isAdmin: boolean;
    page: number;
    limit: number;
    query?: string;
    roomId?: string;
    date?: string;
    order?: 'ASC' | 'DESC';
}

export class SchedulesService {

    private logsService: LogsService;
    private mailService: MailService;

    constructor() {
        this.logsService = new LogsService();
        this.mailService = new MailService();
    }

    private timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60) + minutes;
    }

    private minutesToTime(minutes: number): string {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    public async getAvailability(roomId: string, dateString: string) {
        const room = await Room.findByPk(roomId);
        if (!room) throw new Error('Sala não encontrada');

        const existingSchedules = await Schedule.findAll({
            where: {
                roomId,
                date: dateString,
                status: { [Op.ne]: ScheduleStatus.CANCELLED }
            },
            attributes: ['startTime']
        });

        const occupiedTimes = new Set(existingSchedules.map(s => s.startTime));

        const slots: string[] = [];

        let currentMinutes = this.timeToMinutes(room.startTime);
        const endMinutes = this.timeToMinutes(room.endTime);
        const duration = room.slotDuration;

        while (currentMinutes < endMinutes) {
            const timeString = this.minutesToTime(currentMinutes);

            if (!occupiedTimes.has(timeString)) {
                slots.push(timeString);
            }

            currentMinutes += duration;
        }

        return slots;
    }

    public async create({ userId, roomId, date, startTime }: CreateScheduleDTO) {
        const room = await Room.findByPk(roomId);
        if (!room) throw new Error('Sala não encontrada');

        const existing = await Schedule.findOne({
            where: {
                roomId,
                date,
                startTime,
                status: { [Op.ne]: ScheduleStatus.CANCELLED }
            }
        });

        if (existing) {
            throw new Error('Horário já reservado por outro usuário.');
        }

        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + room.slotDuration;
        const endTime = this.minutesToTime(endMinutes);

        const schedule = await Schedule.create({
            userId,
            roomId,
            date,
            startTime,
            endTime,
            status: ScheduleStatus.PENDING
        });

        // try {
        //     const user = await User.findByPk(userId);
        //     const admins = await User.findAll({ where: { role: 'ADMIN' } });
        //     if (user && admins.length > 0) {
        //         admins.forEach(async (admin) => {
        //             await this.mailService.notifyAdminNewSchedule(
        //                 admin.email,
        //                 `${user.name} ${user.lastName}`,
        //                 user.email,
        //                 date,
        //                 startTime
        //             );
        //         });
        //     }
        // } catch { }

        await this.logsService.createLog(
            userId,
            'Criação de agendamento',
            'Agendamento',
            { scheduleId: schedule.id, date, startTime }
        );

        return schedule;
    }

    public async getAll({ userId, isAdmin, page, limit, query, roomId, date, order = 'DESC' }: ListFilter) {
        const offset = (page - 1) * limit;
        const where: WhereOptions<Schedule> = {
            ...(!isAdmin && userId ? { userId } : {}),

            ...(roomId ? { roomId } : {}),

            ...(date ? { date } : {})
        };

        const userWhere: WhereOptions<User> = {
            ...(query ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { lastName: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            } : {})
        };

        const { count, rows } = await Schedule.findAndCountAll({
            where,
            limit,
            offset,
            order: [
                ['date', order],
                ['startTime', order]
            ],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'lastName', 'email', 'role'],
                    where: userWhere,
                    required: !!query
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
        const user = await User.findByPk(schedule.userId);
        // if (status === ScheduleStatus.CONFIRMED) {
        //     try {
        //         const user = await User.findByPk(schedule.userId);
        //         if (user) {
        //             await this.mailService.sendSchedulingConfirmation(
        //                 user.email,
        //                 `${user.name} ${user.lastName}`,
        //                 schedule.date,
        //                 schedule.startTime
        //             );
        //         }
        //     } catch { }
        // }

        if (status === ScheduleStatus.CANCELLED || status === ScheduleStatus.COMPLETED) {
            await this.logsService.createLog(
                schedule.userId,
                `Alteração de status para ${statusMap[status]}`,
                'Agendamento',
                { scheduleId: schedule.id }
            );
        }
        return { userEmail: user?.email, userName: user?.name, dateString: schedule.date, time: schedule.startTime };
    }
}