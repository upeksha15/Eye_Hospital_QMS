export function requireStaff(req, res, next) {
  if (req.userType !== 'staff') {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }
  next();
}

