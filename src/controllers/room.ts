import { RoomsService } from '../services/room';
import { Request, Response } from 'express';
import { z } from 'zod';


export class RoomsController {
    private static roomsService = new RoomsService();

    public static async getAll(_req: Request, res: Response) {
        const rooms = await RoomsController.roomsService.getAll();
        res.json(rooms);
    }

    public static async create(req: Request, res: Response) {
        const singleRoomSchema = z.object({
            name: z.string(),
            startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm inválido"),
            endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm inválido"),
            slotDuration: z.number().min(15).default(30)
        });

        const schema = z.array(singleRoomSchema);

        try {
            const data = schema.parse(req.body);
            const adminId = req.userId;
            const rooms = await RoomsController.roomsService.create(data, adminId);
            res.status(201).json(rooms);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: 'Validation error', errors: error });
                return;
            }
            res.status(400).json({ error });
        }
    }

    public static async update(req: Request, res: Response) {
        const paramsSchema = z.object({
            id: z.uuid("ID inválido"),
        });

        const bodySchema = z.object({
            name: z.string().optional(),
            startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm inválido").optional(),
            endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm inválido").optional(),
            slotDuration: z.number().min(15).optional(),
            isActive: z.boolean().optional()
        });

        try {
            const { id } = paramsSchema.parse(req.params);
            const data = bodySchema.parse(req.body);
            const adminId = req.userId;

            const updatedRoom = await RoomsController.roomsService.update(id, data, adminId);

            res.json(updatedRoom);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error
                });
            }

            if (error instanceof Error) {
                if (error.message === 'Sala não encontrada') {
                    return res.status(404).json({ message: error.message });
                }

                return res.status(400).json({ message: error.message });
            }

            return res.status(500).json({ message: 'Erro desconhecido' });
        }
    }

    public static async delete(req: Request, res: Response) {
        const paramsSchema = z.object({
            id: z.uuid("ID inválido"),
        });

        try {
            const { id } = paramsSchema.parse(req.params);
            const adminId = req.userId;

            await RoomsController.roomsService.delete(id, adminId);

            res.status(204).send();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error
                });
            }

            if (error instanceof Error) {
                if (error.message === 'Sala não encontrada') {
                    return res.status(404).json({ message: error.message });
                }

                return res.status(400).json({ message: error.message });
            }

            return res.status(500).json({ message: 'Erro desconhecido' });
        }
    }
}