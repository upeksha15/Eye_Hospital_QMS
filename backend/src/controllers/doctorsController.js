import Doctor from '../models/Doctor.js';

export async function listDoctors(req, res) {
  try {
    const doctors = await Doctor.find({ isActive: true })
      .select('_id fullName speciality room initials status')
      .sort({ fullName: 1 })
      .lean();
    res.json({ success: true, doctors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load doctors' });
  }
}

export async function getDoctor(req, res) {
  try {
    const doc = await Doctor.findById(req.params.id)
      .select('_id fullName speciality room initials status isActive')
      .lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, doctor: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load doctor' });
  }
}
