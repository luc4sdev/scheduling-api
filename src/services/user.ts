import { Op, WhereOptions } from 'sequelize';
import { User, UserAttributes } from '../models/User';
import bcrypt from 'bcryptjs';
import { LogsService } from './log';

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
    sortBy?: string;
    order?: string;
}

export class UsersService {

    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    public async getAll({ page = 1, limit = 10, query, sortBy = 'createdAt', order = 'DESC' }: GetAllParams) {

        const where: any = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.like]: `%${query}%` } },
                { email: { [Op.like]: `%${query}%` } },
            ];
        }
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            where,
            limit,
            offset,
            order: [[sortBy, order.toUpperCase()]],
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
        const deletedCount = await User.destroy({
            where: { id }
        });

        return deletedCount > 0;
    }
}