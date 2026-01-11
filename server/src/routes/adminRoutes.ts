import { Router } from 'express';
import { getAdminStats, getAllUsers, updateUserSubscription, deleteUser, saveUser, getAllPapers, deletePaper, savePaper, getAllGuides, deleteGuide, saveGuide } from '../controllers/adminController';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Apply auth and admin check to all routes in this router
router.use(authenticate as any);
router.use(authorizeAdmin as any);

router.get('/stats', getAdminStats);

router.get('/users', getAllUsers);
router.post('/users', saveUser);
router.post('/users/:id/subscription', updateUserSubscription);
router.delete('/users/:id', deleteUser);
router.post('/users/:id', saveUser); // Update existing

router.get('/papers', getAllPapers);
router.post('/papers', savePaper);
router.delete('/papers/:id', deletePaper);
router.post('/papers/:id', savePaper);

router.get('/guides', getAllGuides);
router.post('/guides', saveGuide);
router.delete('/guides/:id', deleteGuide);
router.post('/guides/:id', saveGuide);

export default router;
