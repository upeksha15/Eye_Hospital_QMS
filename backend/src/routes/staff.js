import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { changePassword, listAvailableMedicalStaff } from '../controllers/staffController.js';
import {
  getPatientDetailsSummary,
  getPatientDetailsSummaryPdf,
} from '../controllers/reportsController.js';

const router = express.Router();

function requireStaffMedicalOrAdmin(req, res, next) {
  if (req.userType !== 'staff' || !['admin', 'medical_staff'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  next();
}

router.post('/change-password', authMiddleware, changePassword);
router.get('/available-medical-staff', authMiddleware, listAvailableMedicalStaff);
router.get(
  '/patient-details-summary',
  authMiddleware,
  requireStaffMedicalOrAdmin,
  getPatientDetailsSummary
);
router.get(
  '/patient-details-summary.pdf',
  authMiddleware,
  requireStaffMedicalOrAdmin,
  getPatientDetailsSummaryPdf
);

export default router;

