import { UsersService } from '../services/user';
import { Request, Response } from 'express';
import { z } from 'zod';


export class UsersController {

    private static usersService = new UsersService();

    public static async getAll(req: Request, res: Response) {
        const querySchema = z.object({
            page: z.string().transform(Number).optional(),
            limit: z.string().transform(Number).optional(),
            query: z.string().optional(),
            date: z.string().optional(),
            order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
        });

        try {
            const { page = 1, limit = 10, query, date, order } = querySchema.parse(req.query);

            const result = await UsersController.usersService.getAll({
                page,
                limit,
                query,
                date,
                order
            });

            res.json(result);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(500).json({ message: 'Error getting users', error });
        }
    }

    public static async getOne(req: Request, res: Response) {
        const paramsSchema = z.object({
            id: z.uuid("Invalid UUID format"),
        });

        try {
            const { id } = paramsSchema.parse(req.params);
            const user = await UsersController.usersService.getById(id);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json(user);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(500).json({ message: 'Internal server error', error });
        }
    }

    public static async me(req: Request, res: Response) {
        try {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({ message: 'User ID not found in request' });
                return;
            }

            const user = await UsersController.usersService.getById(userId);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }


    public static async create(req: Request, res: Response) {
        const createUserSchema = z.object({
            name: z.string().min(2),
            lastName: z.string().min(2),
            email: z.email(),
            password: z.string().min(6),
            cep: z.string().min(8),
            street: z.string(),
            number: z.string(),
            complement: z.string(),
            neighborhood: z.string(),
            city: z.string(),
            state: z.string().length(2),
            role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
        });

        try {
            const data = createUserSchema.parse(req.body);

            const existingUser = await UsersController.usersService.getByEmail(data.email);
            if (existingUser) {
                res.status(409).json({ message: 'Já existe um usuário com esse email' });
                return;
            }

            const newUser = await UsersController.usersService.create(data);
            res.status(201).json(newUser);

        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(400).json({ message: 'Error creating user', error });
        }
    }

    public static async update(req: Request, res: Response) {
        const paramsSchema = z.object({
            id: z.uuid(),
        });

        const updateUserSchema = z.object({
            name: z.string().min(2).optional(),
            lastName: z.string().min(2).optional(),
            email: z.email().optional(),
            password: z.string().min(6).optional(),
            isActive: z.boolean().optional(),
            permissions: z.array(z.string()).optional(),
            cep: z.string().min(8).optional(),
            street: z.string().optional(),
            number: z.string().optional(),
            complement: z.string().optional(),
            neighborhood: z.string().optional(),
            city: z.string().optional(),
            state: z.string().length(2).optional(),
            role: z.enum(['USER', 'ADMIN']).optional(),
        });

        try {
            const { id } = paramsSchema.parse(req.params);
            const data = updateUserSchema.parse(req.body);

            const existingUser = await UsersController.usersService.getById(id);
            if (!existingUser) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            const user = await UsersController.usersService.getById(req.userId);
            const isAdmin = user?.role === 'ADMIN';

            if (!isAdmin && req.userId !== existingUser.id) {
                res.status(403).json({ message: 'Forbidden: You do not have permission to update this user' });
                return;
            }

            const updatedUser = await UsersController.usersService.update(id, data);

            res.json(updatedUser);

        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(400).json({ message: 'Error updating user', error });
        }
    }

    public static async delete(req: Request, res: Response) {
        const paramsSchema = z.object({
            id: z.uuid(),
        });

        try {
            const { id } = paramsSchema.parse(req.params);

            const success = await UsersController.usersService.delete(id);

            if (success) {
                res.status(200).json({ message: 'User deleted successfully' });
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(400).json({ message: 'Error deleting user', error });
        }
    }
}