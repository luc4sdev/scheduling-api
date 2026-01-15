import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { Log } from '../models/Log';
import { User } from '../models/User';
import { Op, WhereOptions } from 'sequelize';

interface GetLogsParams {
    requestingUserId: string;
    page?: number;
    limit?: number;
    query?: string;
    date?: string;
    order?: 'ASC' | 'DESC';
}

export class LogsService {

    public async createLog(userId: string, action: string, module: string, details?: object) {
        return Log.create({
            userId,
            action,
            module,
            details
        });
    }

    public async getAll({ requestingUserId, page = 1, limit = 10, query, date, order = 'DESC' }: GetLogsParams) {
        const requester = await User.findByPk(requestingUserId);
        if (!requester) throw new Error('User not found');

        const offset = (page - 1) * limit;
        const where: WhereOptions<Log> = {
            ...(requester.role !== 'ADMIN' ? { userId: requestingUserId } : {}),

            ...(query ? {
                [Op.or]: [
                    { action: { [Op.like]: `%${query}%` } },
                    { module: { [Op.like]: `%${query}%` } }
                ]
            } : {}),

            ...(date ? {
                createdAt: {
                    [Op.between]: [startOfDay(parseISO(date)), endOfDay(parseISO(date))]
                }
            } : {})
        };

        const { count, rows } = await Log.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', order]],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'lastName', 'role', 'email'],
                    required: true
                }
            ]
        });

        return {
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }
}