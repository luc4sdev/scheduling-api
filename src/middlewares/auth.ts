import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'

declare global {
    namespace Express {
        interface Request {
            userId: string
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        let token: string | undefined;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const parts = authHeader.split(' ');
                if (parts.length === 2) token = parts[1];
            }
        }
        if (!token) {
            return res.status(401).json({ message: 'Token not provided' });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };

        req.userId = decoded.sub;

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}