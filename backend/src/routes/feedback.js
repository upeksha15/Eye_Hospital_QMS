import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createFeedback, listFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/', authMiddleware, createFeedback);
router.get('/', listFeedback);

export default router;
