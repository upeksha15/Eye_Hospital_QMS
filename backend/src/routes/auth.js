import express from 'express';
import { register, login, me, syncPatient } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.put('/sync-patient', authMiddleware, syncPatient);

export default router;
