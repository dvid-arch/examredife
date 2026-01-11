import { Router } from 'express';
import { login, register, refreshToken, logout, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/profile', authenticate as any, getProfile);

export default router;
