import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, refreshToken, logout, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { 
  validateRegister, 
  validateLogin, 
  validateRefreshToken 
} from '../middleware/validation';
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// Rate limiter for auth endpoints (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'), // 5 requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});

router.post('/register', authLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.post('/refresh', validateRefreshToken, handleValidationErrors, refreshToken);
router.post('/logout', authenticate as any, logout);
router.get('/profile', authenticate as any, getProfile);

export default router;
