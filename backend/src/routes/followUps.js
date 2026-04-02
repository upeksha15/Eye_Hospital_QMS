import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createFollowUp, listFollowUps, updateFollowUp, deleteFollowUp } from '../controllers/followUpController.js';

const router = express.Router();

router.post('/', authMiddleware, createFollowUp);
router.get('/', authMiddleware, listFollowUps);
router.patch('/:id', authMiddleware, updateFollowUp);
router.delete('/:id', authMiddleware, deleteFollowUp);

export default router;
