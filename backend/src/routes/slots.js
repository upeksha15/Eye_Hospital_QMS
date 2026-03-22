import express from 'express';
import { getSlotsForDoctorMonth } from '../controllers/slotController.js';

const router = express.Router();

router.get('/:doctorId', getSlotsForDoctorMonth);

export default router;
