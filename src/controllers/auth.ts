import { AuthService } from '@/services/auth';
import { Request, Response } from 'express';
import { z } from 'zod';


export class AuthController {
    private static authService = new AuthService();

    public static async authenticate(req: Request, res: Response) {
        const authBodySchema = z.object({
            email: z.email(),
            password: z.string(),
        });

        try {
            const { email, password } = authBodySchema.parse(req.body);

            const { token } = await AuthController.authService.authenticate({
                email,
                password
            });

            res.status(201).json({ token });
            return;

        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: error
                });
            }
            if (error instanceof Error && error.message === 'Invalid credentials') {
                return res.status(400).json({ message: 'Invalid credentials!' });
            }
            return res.status(500).json({ message: 'Internal server error', error });
        }
    }
}