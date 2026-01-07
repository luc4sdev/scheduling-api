import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '@/env';
import { LogsService } from './log';

interface AuthRequest {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
}

export class AuthService {

    private logsService: LogsService;

    constructor() {
        this.logsService = new LogsService();
    }

    public async authenticate({ email, password }: AuthRequest): Promise<AuthResponse> {
        const user = await User.findOne({
            where: { email }
        });

        if (!user || user.role === 'ADMIN') {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            {
                sub: user.id,
                role: user.role
            },
            env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        await this.logsService.createLog(
            user.id,
            'Login',
            'Minha Conta'
        );

        return { token };
    }
}