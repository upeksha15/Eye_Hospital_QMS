import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateAppointmentDate } from '../middleware/validateDate.js';
import { checkSlotAvailability } from '../middleware/checkSlotAvailability.js';
import {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  validateAppointmentDate,
  checkSlotAvailability,
  createAppointment
);

router.get('/mine', authMiddleware, getMyAppointments);
router.get('/:id', authMiddleware, getAppointmentById);
router.patch('/:id/cancel', authMiddleware, cancelAppointment);

export default router;
