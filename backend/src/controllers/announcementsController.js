import Announcement from '../models/Announcement.js';

export async function listAnnouncements(req, res) {
  try {
    const items = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, announcements: items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load announcements' });
  }
}
