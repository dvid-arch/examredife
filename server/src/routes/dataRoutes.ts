import { Router } from 'express';
import { getPerformance, savePerformance, getGuides, getLeaderboard, updateLeaderboard } from '../controllers/dataController';
import { authenticate } from '../middleware/auth';
import { validatePerformance, validateLeaderboardEntry } from '../middleware/validation';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

router.get('/performance', authenticate as any, getPerformance);
router.post('/performance', authenticate as any, validatePerformance, handleValidationErrors, savePerformance);
router.get('/guides', getGuides);
router.get('/leaderboard', getLeaderboard);
router.post('/leaderboard', validateLeaderboardEntry, handleValidationErrors, updateLeaderboard);

export default router;
