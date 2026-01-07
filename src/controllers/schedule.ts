import { UsersService } from '@/services/user';
import { Request, Response } from 'express';
import { z } from 'zod';
import { ScheduleStatus } from '../models/Schedule';
import { SchedulesService } from '@/services/schedule';

export class SchedulesController {
    private static service = new SchedulesService();
    private static usersService = new UsersService();

    public static async getAvailability(req: Request, res: Response) {
        const schema = z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
            roomId: z.uuid("ID da sala inválido")
        });

        try {
            const { date, roomId } = schema.parse(req.query);
            const availableSlots = await SchedulesController.service.getAvailability(roomId, date);

            return res.json(availableSlots);
        } catch (error: any) {
            if (error.message === 'Sala não encontrada') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(400).json({ error });
        }
    }

    public static async create(req: Request, res: Response) {
        const schema = z.object({
            roomId: z.uuid(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)"),
            startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido (HH:mm)")
        });

        try {
            const { roomId, date, startTime } = schema.parse(req.body);
            const userId = req.userId;

            const schedule = await SchedulesController.service.create({ userId, roomId, date, startTime });
            return res.status(201).json(schedule);
        } catch (error: any) {
            return res.status(400).json({ message: error.message || 'Erro ao agendar' });
        }
    }

    public static async getAll(req: Request, res: Response) {
        const schema = z.object({
            page: z.string().transform(Number).optional(),
            limit: z.string().transform(Number).optional(),
            query: z.string().optional(),
            roomId: z.string().optional(),
            date: z.string().optional(),
        });

        try {
            const { page = 1, limit = 10, query, roomId, date } = schema.parse(req.query);

            const user = await SchedulesController.usersService.getById(req.userId);
            const isAdmin = user?.role === 'ADMIN';

            const schedules = await SchedulesController.service.getAll({
                userId: req.userId,
                isAdmin,
                page,
                limit,
                query,
                roomId,
                date
            });

            return res.json(schedules);
        } catch (error) {
            return res.status(500).json({ error });
        }
    }

    public static async updateStatus(req: Request, res: Response) {
        const schemaBody = z.object({
            status: z.enum(ScheduleStatus)
        });
        const schemaParams = z.object({
            id: z.uuid()
        });

        try {
            const { id } = schemaParams.parse(req.params);
            const { status } = schemaBody.parse(req.body);

            const updated = await SchedulesController.service.updateStatus(id, status);
            return res.json(updated);
        } catch (error) {
            return res.status(400).json({ error });
        }
    }
}