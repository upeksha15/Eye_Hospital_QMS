import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { changePassword } from '../controllers/staffController.js';

const router = express.Router();

// PUT /api/staff/change-password
router.put('/change-password', authMiddleware, changePassword);

export default router;
