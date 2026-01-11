import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5000', 'http://127.0.0.1:5000'], // Allow Configured Frontend
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Basic Route for testing
app.get('/', (req: Request, res: Response) => {
    res.send('ExamRedi Backend API is running');
});

// Routes
import authRoutes from './routes/authRoutes';
app.use('/auth', authRoutes);
import dataRoutes from './routes/dataRoutes';
app.use('/data', dataRoutes);
import aiRoutes from './routes/aiRoutes';
app.use('/ai', aiRoutes);
import adminRoutes from './routes/adminRoutes';
app.use('/admin', adminRoutes);

// Database Initialization (Mock)
import { initializeData } from './repositories/dataStore';
initializeData();


app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
