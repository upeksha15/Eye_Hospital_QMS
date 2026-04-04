import bcrypt from 'bcryptjs';
import StaffAccount from '../models/StaffAccount.js';
import StaffProfile from '../models/StaffProfile.js';
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

/** Staff panel: active medical staff with profile + online presence (not admin-only). */
export async function listAvailableMedicalStaff(req, res) {
  try {
    if (req.userType !== 'staff') {
      return res.status(403).json({ success: false, message: 'Only staff can access staff panel' });
    }
    if (!['admin', 'medical_staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    await ensureDbConnected();

    const now = Date.now();
    const ONLINE_WINDOW_MS = 5 * 60 * 1000;

    const staff = await StaffAccount.find({ role: 'medical_staff', isActive: true })
      .select('_id fullName email role isActive lastSeenAt profileImage contactNumber')
      .sort({ fullName: 1 })
      .lean();

    const staffIds = staff.map((s) => s._id);
    const profiles = await StaffProfile.find({ staff: { $in: staffIds } })
      .select('staff profileImage contactNumber')
      .lean();

    const profileByStaffId = new Map(
      profiles.map((p) => [
        String(p.staff),
        { profileImage: p.profileImage || '', contactNumber: p.contactNumber || '' },
      ])
    );

    const staffWithPresence = staff.map((s) => {
      const seenAt = s.lastSeenAt ? new Date(s.lastSeenAt).getTime() : 0;
      const isOnline = seenAt > 0 && now - seenAt <= ONLINE_WINDOW_MS;
      const profile = profileByStaffId.get(String(s._id)) || {};
      return {
        ...s,
        profileImage: profile.profileImage || s.profileImage || '',
        contactNumber: profile.contactNumber || s.contactNumber || '',
        isOnline,
      };
    });

    res.json({ success: true, staff: staffWithPresence });
  } catch (err) {
    console.error('listAvailableMedicalStaff error', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to load staff' });
  }
}

export default { changePassword, listAvailableMedicalStaff };
