import express from 'express';
import { register, login, me, syncPatient, syncStaff } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { forgotPassword, verifyOtp, resetPassword } from '../controllers/fogotPassword.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.put('/sync-patient', authMiddleware, syncPatient);
router.put('/sync-staff', authMiddleware, syncStaff);

// Forgot password flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
