import express from 'express';
import {
	getQueueToday,
  getQueueBoardToday,
  getMyQueueStatusToday,
	callNextPatient,
	skipCurrentPatient,
	removePatientFromQueue,
	getSkippedToday,
  markSkippedDone,
} from '../controllers/queueController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:doctorId/today', getQueueToday);
router.get('/:doctorId/board/today', getQueueBoardToday);
router.get('/:doctorId/my-status/today', authMiddleware, getMyQueueStatusToday);
router.post('/:doctorId/call-next', callNextPatient);
router.post('/:doctorId/skip', skipCurrentPatient);
router.get('/:doctorId/skipped/today', getSkippedToday);
router.post('/:doctorId/mark-done/:tokenId', markSkippedDone);
router.post('/:doctorId/remove/:tokenId', removePatientFromQueue);

export default router;
