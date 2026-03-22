import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkIn } from '../controllers/checkinController.js';

const router = express.Router();

router.post('/:appointmentId', authMiddleware, checkIn);

export default router;
