import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized',
            error: 'Authorization header is missing',
            statusCode: 401
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized',
            error: 'Bearer token is missing',
            statusCode: 401
        });
    }

    jwt.verify(token, SECRET_KEY!, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({ 
                success: false,
                message: 'Token verification failed',
                error: err.message === 'jwt expired' ? 'Token has expired' : 'Invalid token',
                statusCode: 401
            });
        }
        req.user = decoded as TokenPayload;
        next();
    });
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Forbidden',
            error: 'Admin access is required',
            statusCode: 403
        });
    }
    next();
};
