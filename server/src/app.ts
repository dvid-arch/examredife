import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000').split(',');

// Security Middleware
app.use(helmet());

// CORS Configuration from environment
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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
