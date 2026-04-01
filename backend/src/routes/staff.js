import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { changePassword } from '../controllers/staffController.js';

const router = express.Router();

router.post('/change-password', authMiddleware, changePassword);

export default router;

