import express from 'express';
import { getQueueToday } from '../controllers/queueController.js';

const router = express.Router();

router.get('/:doctorId/today', getQueueToday);

export default router;
