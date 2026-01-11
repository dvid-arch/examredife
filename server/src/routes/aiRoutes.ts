import { Router } from 'express';
import { chatWithAI, generateStudyGuide, researchTopic } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.post('/chat', chatWithAI);
router.post('/generate-guide', generateStudyGuide);
router.post('/research', researchTopic);

export default router;
