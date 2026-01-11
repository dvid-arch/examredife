import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { readData, writeData, FILE_NAMES } from '../repositories/dataStore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || 'refreshSecret';

// Helper to generate tokens
const generateTokens = (user: any) => {
    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, phone, educationalLevel, state, institution } = req.body;
        const users = readData<any>(FILE_NAMES.USERS);

        if (users.find(u => u.email === email)) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
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

        // Return user info validation (excluding password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'Registration successful',
            user: userWithoutPassword,
            ...tokens
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const users = readData<any>(FILE_NAMES.USERS);
        const user = users.find(u => u.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const tokens = generateTokens(user);
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            ...tokens
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(401).json({ message: 'Refresh Token required' });
            return;
        }

        // Verify refresh token
        jwt.verify(token, REFRESH_SECRET_KEY, (err: any, decoded: any) => {
            if (err) return res.status(403).json({ message: 'Invalid Refresh Token' });

            const users = readData<any>(FILE_NAMES.USERS);
            const user = users.find(u => u.id === decoded.id);

            if (!user) return res.status(403).json({ message: 'User not found' });

            const tokens = generateTokens(user);
            res.json(tokens);
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const logout = (req: Request, res: Response) => {
    // In a real DB we might blacklist the token
    res.json({ message: 'Logged out successfully' });
};

export const getProfile = (req: AuthRequest, res: Response) => {
    if (req.user) {
        const users = readData<any>(FILE_NAMES.USERS);
        const user = users.find(u => u.id === req.user!.id);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
