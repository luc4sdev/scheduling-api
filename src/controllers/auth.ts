import { env } from '../env';
import { AuthService } from '../services/auth';
import { Request, Response, CookieOptions } from 'express';
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

            const expiresIn = 7 * 24 * 60 * 60 * 1000;

            const cookieOptions: CookieOptions = {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: expiresIn,
                path: '/'
            };

            res.cookie('token', token, cookieOptions);

            res.status(201).json({
                message: 'Authenticated'
            });
            return;

        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: 'Validation error',
                    errors: error
                });
                return;
            }
            if (error instanceof Error && error.message === 'Invalid credentials') {
                res.status(400).json({ message: 'Invalid credentials!' });
                return;
            }
            res.status(500).json({ message: 'Internal server error', error });
        }
    }

    public static async logout(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (userId) {
                await AuthController.authService.logout(userId);
            }

            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
            });

            return res.status(200).send({ message: "Logout successfully" });
        } catch (error) {
            res.clearCookie('token');
            return res.status(200).send();
        }
    }
}