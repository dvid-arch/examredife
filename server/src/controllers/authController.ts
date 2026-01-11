import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { readData, writeData, FILE_NAMES } from '../repositories/dataStore';
import { User, UserWithoutPassword, TokenPayload } from '../types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;

if (!SECRET_KEY || !REFRESH_SECRET_KEY) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

// Helper to generate tokens
const generateTokens = (user: User) => {
    const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, SECRET_KEY!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY!, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, phone, educationalLevel, state, institution } = req.body;
        const users = readData<User>(FILE_NAMES.USERS);

        if (users.find(u => u.email === email)) {
            res.status(400).json({ 
                success: false,
                message: 'User already exists',
                error: 'Email is already registered',
                statusCode: 400
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: User = {
            id: Date.now().toString(),
            fullName,
            email,
            password: hashedPassword,
            phone,
            educationalLevel,
            state,
            institution,
            role: 'user',
            subscriptionStatus: 'free',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeData(FILE_NAMES.USERS, users);

        const tokens = generateTokens(newUser);
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: userWithoutPassword as UserWithoutPassword,
                ...tokens
            },
            statusCode: 201
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: 'Failed to register user',
            statusCode: 500
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const users = readData<User>(FILE_NAMES.USERS);
        const user = users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ 
                success: false,
                message: 'Authentication failed',
                error: 'Invalid email or password',
                statusCode: 401
            });
            return;
        }

        const tokens = generateTokens(user);
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword as UserWithoutPassword,
                ...tokens
            },
            statusCode: 200
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: 'Failed to login',
            statusCode: 500
        });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(401).json({ 
                success: false,
                message: 'Unauthorized',
                error: 'Refresh token is required',
                statusCode: 401
            });
            return;
        }

        // Verify refresh token
        jwt.verify(token, REFRESH_SECRET_KEY!, (err: any, decoded: any) => {
            if (err) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Token verification failed',
                    error: 'Invalid or expired refresh token',
                    statusCode: 403
                });
            }

            const users = readData<User>(FILE_NAMES.USERS);
            const user = users.find(u => u.id === decoded.id);

            if (!user) {
                return res.status(403).json({ 
                    success: false,
                    message: 'User not found',
                    error: 'Associated user no longer exists',
                    statusCode: 403
                });
            }

            const tokens = generateTokens(user);
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: tokens,
                statusCode: 200
            });
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: 'Failed to refresh token',
            statusCode: 500
        });
    }
};

export const logout = (req: Request, res: Response) => {
    res.json({ 
        success: true,
        message: 'Logged out successfully',
        statusCode: 200
    });
};

export const getProfile = (req: AuthRequest, res: Response) => {
    if (req.user) {
        const users = readData<User>(FILE_NAMES.USERS);
        const user = users.find(u => u.id === req.user!.id);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                success: true,
                message: 'Profile retrieved successfully',
                data: userWithoutPassword as UserWithoutPassword,
                statusCode: 200
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: 'User not found',
                error: 'The requested user profile does not exist',
                statusCode: 404
            });
        }
    } else {
        res.status(401).json({ 
            success: false,
            message: 'Unauthorized',
            error: 'Authentication required',
            statusCode: 401
        });
    }
};
