import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createFollowUp, listFollowUps, updateFollowUp, deleteFollowUp, listMyFollowUps, patientCancelFollowUp, patientRescheduleFollowUp } from '../controllers/followUpController.js';

const router = express.Router();

router.post('/', authMiddleware, createFollowUp);
router.get('/', authMiddleware, listFollowUps);
router.get('/mine', authMiddleware, listMyFollowUps);
router.patch('/:id', authMiddleware, updateFollowUp);
router.patch('/:id/cancel', authMiddleware, patientCancelFollowUp);
router.patch('/:id/reschedule', authMiddleware, patientRescheduleFollowUp);
router.delete('/:id', authMiddleware, deleteFollowUp);

export default router;
