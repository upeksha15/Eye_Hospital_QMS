import express from 'express';
import {
	getQueueToday,
  getQueueBoardToday,
  getMyQueueStatusToday,
	callNextPatient,
	skipCurrentPatient,
	removePatientFromQueue,
} from '../controllers/queueController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:doctorId/today', getQueueToday);
router.get('/:doctorId/board/today', getQueueBoardToday);
router.get('/:doctorId/my-status/today', authMiddleware, getMyQueueStatusToday);
router.post('/:doctorId/call-next', callNextPatient);
router.post('/:doctorId/skip', skipCurrentPatient);
router.post('/:doctorId/remove/:tokenId', removePatientFromQueue);

export default router;
