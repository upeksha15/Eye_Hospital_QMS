import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireStaff } from '../middleware/requireStaff.js';
import StaffAccount from '../models/StaffAccount.js';

const router = express.Router();

// Staff directory for medical staff (read-only).
router.get('/directory', authMiddleware, requireStaff, async (req, res) => {
  try {
    const staff = await StaffAccount.find({ isActive: true })
      .select('fullName email role createdAt')
      .sort({ fullName: 1 })
      .lean();
    res.json({ success: true, staff });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load staff directory' });
  }
});

export default router;

