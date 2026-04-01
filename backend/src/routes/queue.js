import express from 'express';
import {
	getQueueToday,
	callNextPatient,
	skipCurrentPatient,
	removePatientFromQueue,
} from '../controllers/queueController.js';

const router = express.Router();

router.get('/:doctorId/today', getQueueToday);
router.post('/:doctorId/call-next', callNextPatient);
router.post('/:doctorId/skip', skipCurrentPatient);
router.post('/:doctorId/remove/:tokenId', removePatientFromQueue);

export default router;
