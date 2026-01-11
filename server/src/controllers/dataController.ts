import { Request, Response } from 'express';
import { readData, writeData, FILE_NAMES } from '../repositories/dataStore';
import { AuthRequest } from '../middleware/auth';
import { PerformanceEntry, User } from '../types';

export const getPerformance = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized',
            error: 'Authentication required',
            statusCode: 401
        });
    }

    const allPerformance = readData<PerformanceEntry>(FILE_NAMES.PERFORMANCE);
    const userPerformance = allPerformance.filter(p => p.userId === req.user!.id);
    res.json({
        success: true,
        message: 'Performance data retrieved successfully',
        data: userPerformance,
        statusCode: 200
    });
};

export const savePerformance = (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized',
            error: 'Authentication required',
            statusCode: 401
        });
    }

    const result = req.body;
    const performanceLog = readData<PerformanceEntry>(FILE_NAMES.PERFORMANCE);

    const newEntry: PerformanceEntry = {
        id: Date.now().toString(),
        userId: req.user.id,
        score: result.score,
        quizId: result.quizId,
        timeTaken: result.timeTaken,
        timestamp: Date.now()
    };

    performanceLog.push(newEntry);
    writeData(FILE_NAMES.PERFORMANCE, performanceLog);
    res.status(201).json({
        success: true,
        message: 'Performance data saved successfully',
        data: newEntry,
        statusCode: 201
    });
};

export const getGuides = (req: Request, res: Response) => {
    const guides = readData(FILE_NAMES.GUIDES);
    res.json({
        success: true,
        message: 'Guides retrieved successfully',
        data: guides,
        statusCode: 200
    });
};

export const getLeaderboard = (req: Request, res: Response) => {
    const leaderboard = readData(FILE_NAMES.LEADERBOARD);
    res.json({
        success: true,
        message: 'Leaderboard retrieved successfully',
        data: leaderboard,
        statusCode: 200
    });
};

export const updateLeaderboard = (req: Request, res: Response) => {
    const newScore = req.body;
    const leaderboard = readData<any>(FILE_NAMES.LEADERBOARD);
    leaderboard.push(newScore);
    // Sort and limit
    leaderboard.sort((a, b) => b.score - a.score);
    const top10 = leaderboard.slice(0, 10);
    writeData(FILE_NAMES.LEADERBOARD, top10);
    res.json({
        success: true,
        message: 'Leaderboard updated successfully',
        data: top10,
        statusCode: 200
    });
};
