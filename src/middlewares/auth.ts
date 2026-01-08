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
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ message: 'Token not provided' })
        }

        const [, token] = authHeader.split(' ')

        if (!token) {
            return res.status(401).json({ message: 'Token format invalid' })
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string }

        req.userId = decoded.sub

        return next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' })
    }
}