import bcrypt from 'bcryptjs';
import StaffAccount from '../models/StaffAccount.js';
import { ensureDbConnected } from '../../config/db.js';
import { createAuditLog } from '../utils/auditLogHelper.js';

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    if (req.userType !== 'staff') {
      return res.status(403).json({ success: false, message: 'Only staff can change staff password' });
    }

    await ensureDbConnected();
    const staff = await StaffAccount.findById(req.user._id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    const ok = await staff.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    staff.passwordHash = hash;
    await staff.save();

    // Audit
    try {
      await createAuditLog({ action: 'Staff Password Changed', category: 'user', actorId: staff._id, actorName: staff.fullName, description: 'Staff changed their password' });
    } catch (e) {
      console.error('audit log failed', e);
    }

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('changePassword error', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
}

export default { changePassword };
