import FollowUp from '../models/FollowUp.js';
import DoctorRoom from '../models/DoctorRoom.js';
import DailySlot from '../models/DailySlot.js';
import Appointment from '../models/Appointment.js';
import { startOfDayColombo, formatYMD, totalSlotsForDate, getDayOfWeekColombo, nowColombo } from '../utils/dateUtils.js';

export async function createFollowUp(req, res) {
  try {
    if (req.userType !== 'staff') return res.status(403).json({ success: false, message: 'Forbidden' });

    const {
      appointmentId,
      patientId,
      patientName,
      patientNIC,
      patientPhone,
      doctorId,
      doctorName,
      intervalValue,
      intervalType,
      recommendedDate,
    } = req.body;

    if (!doctorId || !recommendedDate || !intervalValue) {
      return res.status(400).json({ success: false, message: 'doctorId, recommendedDate and intervalValue are required' });
    }

    const recDate = new Date(recommendedDate);
    if (Number.isNaN(recDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid recommendedDate' });
    }

    const dayStart = startOfDayColombo(recDate);
    const todayStart = startOfDayColombo(nowColombo());
    if (dayStart < todayStart) {
      return res.status(400).json({ success: false, message: 'Recommended date cannot be in the past' });
    }

    const doctorRoom = await DoctorRoom.findById(doctorId).lean();
    const dow = getDayOfWeekColombo(dayStart);
    const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const weekdayName = WEEKDAY_NAMES[dow] || '';

    // check availability
    let isAvailable = true;
    if (doctorRoom) {
      const avail = Array.isArray(doctorRoom.availability) ? doctorRoom.availability : [];
      isAvailable = avail.includes(weekdayName);
    } else {
      isAvailable = dow !== 0;
    }
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date.' });
    }

    // compute total slots (daily override or default) and cap by queueLimit
    const daily = await DailySlot.findOne({ doctorId, slotDate: dayStart }).lean();
    let total = daily?.totalSlots ?? totalSlotsForDate(dayStart);
    if (doctorRoom && typeof doctorRoom.queueLimit === 'number') total = Math.min(total, doctorRoom.queueLimit);

    // count existing (non-cancelled) appointments
    const existingCount = await Appointment.countDocuments({ doctorId, appointmentDate: dayStart, status: { $ne: 'cancelled' } });
    if (existingCount >= total) {
      return res.status(400).json({ success: false, message: 'This date queue is full. Please schedule another date.' });
    }

    const payload = {
      appointmentId: appointmentId || undefined,
      patientId: patientId || undefined,
      patientName: patientName || '',
      patientNIC: patientNIC || '',
      patientPhone: patientPhone || '',
      doctorId,
      doctorName: doctorName || (doctorRoom?.doctorName || ''),
      intervalValue: Number(intervalValue),
      intervalType: intervalType || 'days',
      recommendedDate: dayStart,
      createdBy: req.user._id,
    };

    const created = await FollowUp.create(payload);
    res.status(201).json({ success: true, followUp: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to create follow-up' });
  }
}

export async function listFollowUps(req, res) {
  try {
    if (req.userType !== 'staff') return res.status(403).json({ success: false, message: 'Forbidden' });
    const items = await FollowUp.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to list follow-ups' });
  }
}

export async function updateFollowUp(req, res) {
  try {
    if (req.userType !== 'staff') return res.status(403).json({ success: false, message: 'Forbidden' });
    const id = req.params.id;
    const { intervalValue, intervalType, recommendedDate } = req.body;
    if (intervalValue === undefined && intervalType === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }
    const updates = {};
    if (intervalValue !== undefined) {
      const v = Number(intervalValue);
      if (!Number.isFinite(v) || v < 1) return res.status(400).json({ success: false, message: 'Invalid intervalValue' });
      updates.intervalValue = v;
    }
    if (intervalType !== undefined) {
      if (!['days','weeks','months'].includes(intervalType)) return res.status(400).json({ success: false, message: 'Invalid intervalType' });
      updates.intervalType = intervalType;
    }

    // If recommendedDate is provided, validate availability and queue for that date
    if (recommendedDate !== undefined) {
      const rec = new Date(recommendedDate);
      if (Number.isNaN(rec.getTime())) return res.status(400).json({ success: false, message: 'Invalid recommendedDate' });

      const dayStart = startOfDayColombo(rec);
      const todayStart = startOfDayColombo(nowColombo());
      if (dayStart < todayStart) return res.status(400).json({ success: false, message: 'Recommended date cannot be in the past' });

      // load existing followup to get doctorId
      const existing = await FollowUp.findById(id).lean();
      if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found' });
      const doctorId = existing.doctorId;
      const doctorRoom = await DoctorRoom.findById(doctorId).lean();
      const dow = getDayOfWeekColombo(dayStart);
      const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const weekdayName = WEEKDAY_NAMES[dow] || '';
      let isAvailable = true;
      if (doctorRoom) {
        const avail = Array.isArray(doctorRoom.availability) ? doctorRoom.availability : [];
        isAvailable = avail.includes(weekdayName);
      } else {
        isAvailable = dow !== 0;
      }
      if (!isAvailable) return res.status(400).json({ success: false, message: 'Doctor is not available on this date.' });

      const daily = await DailySlot.findOne({ doctorId, slotDate: dayStart }).lean();
      let total = daily?.totalSlots ?? totalSlotsForDate(dayStart);
      if (doctorRoom && typeof doctorRoom.queueLimit === 'number') total = Math.min(total, doctorRoom.queueLimit);

      const existingCount = await Appointment.countDocuments({ doctorId, appointmentDate: dayStart, status: { $ne: 'cancelled' } });
      if (existingCount >= total) return res.status(400).json({ success: false, message: 'This date queue is full. Please schedule another date.' });

      updates.recommendedDate = dayStart;
    }

    const updated = await FollowUp.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, followUp: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to update follow-up' });
  }
}

export async function deleteFollowUp(req, res) {
  try {
    if (req.userType !== 'staff') return res.status(403).json({ success: false, message: 'Forbidden' });
    const id = req.params.id;
    const deleted = await FollowUp.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to delete follow-up' });
  }
}
