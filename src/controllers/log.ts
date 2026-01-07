import { LogsService } from '@/services/log';
import { Request, Response } from 'express';
import { z } from 'zod';


export class LogsController {
    private static logsService = new LogsService();

    public static async getLogs(req: Request, res: Response) {
        const querySchema = z.object({
            page: z.string().transform(Number).optional(),
            limit: z.string().transform(Number).optional(),
            query: z.string().optional(),
            date: z.string().optional(),
            order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
        });

        try {
            const requestingUserId = req.userId;

            if (!requestingUserId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const { page = 1, limit = 10, query, date, order } = querySchema.parse(req.query);

            const result = await LogsController.logsService.getAll({
                requestingUserId,
                page,
                limit,
                query,
                date,
                order
            });

            return res.json(result);

        } catch (error) {
            console.error(error);

            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: 'Validation error', errors: error });
            }

            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}