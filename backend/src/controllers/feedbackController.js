import Feedback from '../models/Feedback.js';

export async function createFeedback(req, res) {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can submit feedback' });
    }

    const { message, rating } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Feedback message is required' });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const feedback = await Feedback.create({
      patientId: req.user._id,
      message: String(message).trim(),
      rating: numRating,
    });

    const populated = await Feedback.findById(feedback._id)
      .populate({ path: 'patientId', model: 'Patient', select: 'fullName nic' })
      .lean();

    res.status(201).json({ success: true, feedback: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to submit feedback' });
  }
}

export async function listFeedback(req, res) {
  try {
    const items = await Feedback.find()
      .populate({ path: 'patientId', model: 'Patient', select: 'fullName nic' })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = (items || []).map((f) => ({
      _id: f._id,
      message: f.message,
      rating: f.rating,
      createdAt: f.createdAt,
      patientName: f.patientId?.fullName || 'Patient',
      patientNIC: f.patientId?.nic || '',
    }));

    res.json({ success: true, feedback: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load feedback' });
  }
}
