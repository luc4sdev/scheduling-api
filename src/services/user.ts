import { Op, WhereOptions } from 'sequelize';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { LogsService } from './log';
import { Log } from '../models/Log';
import { Schedule } from '../models/Schedule';
import { endOfDay, parseISO, startOfDay } from 'date-fns';

export interface UserCreateDTO {
    name: string;
    lastName: string;
    email: string;
    password: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    role: 'USER' | 'ADMIN';
}

export interface GetAllParams {
    page?: number;
    limit?: number;
    query?: string;
    date?: string;
    order?: 'ASC' | 'DESC';
}

export class UsersService {

    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    public async getAll({ page = 1, limit = 10, query, date, order = 'DESC' }: GetAllParams) {

        const where: WhereOptions<User> = {
            role: 'USER',

            ...(query ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            } : {}),

            ...(date ? {
                createdAt: {
                    [Op.between]: [startOfDay(parseISO(date)), endOfDay(parseISO(date))]
                }
            } : {})
        };

        if (date) {
            const searchDate = parseISO(date);
            where.createdAt = {
                [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)]
            };
        }
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            where,
            limit,
            offset,
            order: [['createdAt', order]],
            attributes: { exclude: ['password'] }
        });

        return {
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    public async getById(id: string) {
        return User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
    }

    public async getByEmail(email: string) {
        return User.findOne({
            where: { email }
        });
    }

    public async create(data: UserCreateDTO) {
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await User.create({
            ...data,
            password: hashedPassword
        });

        await this.logsService.createLog(
            user.id,
            'Cadastro de usuário',
            'Minha Conta',
            { email: user.email, role: user.role }
        );

        const userJson = user.toJSON();
        const { password, ...userWithoutPassword } = userJson;

        return userWithoutPassword;
    }

    public async update(id: string, data: Partial<UserCreateDTO>) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error('User not found');
        }

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        const emailChanged = data.email && data.email !== user.email;
        await user.update(data);

        if (emailChanged) {
            await this.logsService.createLog(
                user.id,
                'Atualização de e-mail',
                'Minha Conta'
            );
        } else {
            await this.logsService.createLog(
                user.id,
                'Atualização de dados cadastrais',
                'Minha Conta'
            );
        }

        const userJson = user.toJSON();
        const { password, ...userWithoutPassword } = userJson;
        return userWithoutPassword;
    }

    public async delete(id: string): Promise<boolean> {
        await Log.destroy({
            where: { userId: id }
        });
        await Schedule.destroy({
            where: { userId: id }
        })
        const deletedCount = await User.destroy({
            where: { id }
        });

        return deletedCount > 0;
    }

    public async createDefaultAdminUser() {
        const existingUser = await this.getByEmail('admin@email.com');
        if (existingUser) {
            return existingUser;
        }
        const adminUser: UserCreateDTO = {
            name: 'Admin',
            lastName: 'User',
            email: 'admin@email.com',
            role: 'ADMIN',
            password: 'admin123',
            cep: '00000-000',
            street: 'Admin Street',
            number: '1',
            complement: '',
            neighborhood: 'Admin Neighborhood',
            city: 'Admin City',
            state: 'AS'
        }
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);

        const user = await User.create({
            ...adminUser,
            password: hashedPassword
        });

        await this.logsService.createLog(
            user.id,
            'Cadastro de usuário',
            'Minha Conta',
            { email: user.email, role: user.role }
        );

        const userJson = user.toJSON();
        const { password, ...userWithoutPassword } = userJson;

        return userWithoutPassword;
    }
}