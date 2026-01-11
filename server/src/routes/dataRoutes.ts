import { Router } from 'express';
import { getPerformance, savePerformance, getGuides, getLeaderboard, updateLeaderboard } from '../controllers/dataController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/performance', authenticate as any, getPerformance);
router.post('/performance', authenticate as any, savePerformance);
router.get('/guides', getGuides);
router.get('/leaderboard', getLeaderboard);
router.post('/leaderboard', updateLeaderboard);

export default router;
