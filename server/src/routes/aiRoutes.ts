import { Router } from 'express';
import { chatWithAI, generateStudyGuide, researchTopic } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { validateAIChat, validateGenerateGuide, validateResearchTopic } from '../middleware/validation';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate as any);

router.post('/chat', validateAIChat, handleValidationErrors, chatWithAI);
router.post('/generate-guide', validateGenerateGuide, handleValidationErrors, generateStudyGuide);
router.post('/research', validateResearchTopic, handleValidationErrors, researchTopic);

export default router;
