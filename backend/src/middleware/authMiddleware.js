import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import StaffAccount from '../models/StaffAccount.js';

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const typ = decoded.typ || 'patient';

    if (typ === 'staff') {
      const staff = await StaffAccount.findById(decoded.id).select('-passwordHash');
      if (!staff) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (!staff.isActive) {
        return res.status(401).json({ success: false, message: 'Account disabled' });
      }
      req.user = staff;
      req.userType = 'staff';
      return next();
    }

    const patient = await Patient.findById(decoded.id).select('-passwordHash');
    if (!patient) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = patient;
    req.userType = 'patient';
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
