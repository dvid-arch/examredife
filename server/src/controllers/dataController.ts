import { Request, Response } from 'express';
import { readData, writeData, FILE_NAMES } from '../repositories/dataStore';
import { AuthRequest } from '../middleware/auth';

export const getPerformance = (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const allPerformance = readData<any>(FILE_NAMES.PERFORMANCE);
    const userPerformance = allPerformance.filter(p => p.userId === req.user!.id);
    res.json(userPerformance);
};

export const savePerformance = (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const result = req.body;
    const performanceLog = readData<any>(FILE_NAMES.PERFORMANCE);

    const newEntry = {
        id: Date.now().toString(),
        userId: req.user.id,
        ...result,
        timestamp: Date.now()
    };

    performanceLog.push(newEntry);
    writeData(FILE_NAMES.PERFORMANCE, performanceLog);
    res.json(newEntry);
};

export const getGuides = (req: Request, res: Response) => {
    const guides = readData<any>(FILE_NAMES.GUIDES);
    res.json(guides);
};

export const getLeaderboard = (req: Request, res: Response) => {
    const leaderboard = readData<any>(FILE_NAMES.LEADERBOARD);
    res.json(leaderboard);
};

export const updateLeaderboard = (req: Request, res: Response) => {
    const newScore = req.body;
    const leaderboard = readData<any>(FILE_NAMES.LEADERBOARD);
    leaderboard.push(newScore);
    // Sort and limit
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    writeData(FILE_NAMES.LEADERBOARD, top10);
    res.json(top10);
};
