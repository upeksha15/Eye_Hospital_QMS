import express from 'express';
import {
  register,
  login,
  me,
  syncPatient,
  syncStaff,
  deletePatientAccount,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.delete('/account', authMiddleware, deletePatientAccount);
router.put('/sync-patient', authMiddleware, syncPatient);
router.put('/sync-staff', authMiddleware, syncStaff);

export default router;
