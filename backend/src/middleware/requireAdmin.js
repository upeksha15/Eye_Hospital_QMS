// Guard admin-only routes (staff + admin role required).
export function requireAdmin(req, res, next) {
  if (req.userType !== 'staff' || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}
