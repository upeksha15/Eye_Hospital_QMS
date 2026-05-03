import mongoose from 'mongoose';
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

    // generate booking reference for this follow-up so staff and patient share it
    async function generateBookingRef() {
      const year = new Date().getFullYear();
      const count = await Appointment.countDocuments({
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      });
      return `OPD-${year}-${String(count + 1).padStart(4, '0')}`;
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
      bookingRef: await generateBookingRef(),
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

export async function listMyFollowUps(req, res) {
  try {
    if (req.userType !== 'patient') return res.status(403).json({ success: false, message: 'Forbidden' });
    const patientId = req.user._id;
    // try to find follow-ups by patientId first, fallback to patient NIC
    const byId = await FollowUp.find({ patientId }).sort({ recommendedDate: 1 }).lean();
    if (byId && byId.length > 0) {
      return res.json({ success: true, items: byId });
    }
    const nic = req.user.nic || req.user.NIC || '';
    if (!nic) return res.json({ success: true, items: [] });
    const byNic = await FollowUp.find({ patientNIC: nic }).sort({ recommendedDate: 1 }).lean();
    res.json({ success: true, items: byNic || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to list patient follow-ups' });
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

    const existing = await FollowUp.findById(id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    // If recommendedDate is provided, validate availability and queue for that date
    if (recommendedDate !== undefined) {
      const rec = new Date(recommendedDate);
      if (Number.isNaN(rec.getTime())) return res.status(400).json({ success: false, message: 'Invalid recommendedDate' });

      const dayStart = startOfDayColombo(rec);
      const todayStart = startOfDayColombo(nowColombo());
      if (dayStart < todayStart) return res.status(400).json({ success: false, message: 'Recommended date cannot be in the past' });

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

    if (existing && existing.patientAppointmentId) {
      updates.patientAppointmentId = null;
      updates.patientRescheduled = false;
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

export async function patientCancelFollowUp(req, res) {
  try {
    if (req.userType !== 'patient') return res.status(403).json({ success: false, message: 'Forbidden' });
    const id = req.params.id;
    const existing = await FollowUp.findById(id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    const patientId = String(req.user._id);
    const nic = req.user.nic || req.user.NIC || '';
    const owns = (existing.patientId && String(existing.patientId) === patientId) || (existing.patientNIC && existing.patientNIC === nic);
    if (!owns) return res.status(403).json({ success: false, message: 'Forbidden' });
    // Delete the follow-up record so it is removed from both patient and staff views
    const deleted = await FollowUp.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, followUp: deleted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to cancel follow-up' });
  }
}

export async function patientRescheduleFollowUp(req, res) {
  try {
    if (req.userType !== 'patient') return res.status(403).json({ success: false, message: 'Forbidden' });
    const id = req.params.id;
    const { recommendedDate } = req.body;
    if (!recommendedDate) return res.status(400).json({ success: false, message: 'recommendedDate is required' });

    const existing = await FollowUp.findById(id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    const patientId = String(req.user._id);
    const nic = req.user.nic || req.user.NIC || '';
    const owns = (existing.patientId && String(existing.patientId) === patientId) || (existing.patientNIC && existing.patientNIC === nic);
    if (!owns) return res.status(403).json({ success: false, message: 'Forbidden' });

    const rec = new Date(recommendedDate);
    if (Number.isNaN(rec.getTime())) return res.status(400).json({ success: false, message: 'Invalid recommendedDate' });
    const dayStart = startOfDayColombo(rec);
    const todayStart = startOfDayColombo(nowColombo());
    if (dayStart < todayStart) return res.status(400).json({ success: false, message: 'Recommended date cannot be in the past' });

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

    // move or create appointment for patient using same booking reference as follow-up
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const follow = await FollowUp.findById(id).session(session);
      if (!follow) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: 'Follow-up not found' });
      }

      // check capacity for target date
      const targetDaily = await DailySlot.findOne({ doctorId, slotDate: dayStart }).session(session).lean();
      let targetTotal = targetDaily?.totalSlots ?? totalSlotsForDate(dayStart);
      const doctorRoomDoc = await DoctorRoom.findById(doctorId).lean();
      if (doctorRoomDoc && typeof doctorRoomDoc.queueLimit === 'number') targetTotal = Math.min(targetTotal, doctorRoomDoc.queueLimit);

      const existingCount = await Appointment.countDocuments({ doctorId, appointmentDate: dayStart, status: { $ne: 'cancelled' } }).session(session);
      if (existingCount >= targetTotal) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: 'This date queue is full. Please schedule another date.' });
      }

      // find any existing appointments that correspond to this follow-up
      const oldDayStart = follow.recommendedDate ? startOfDayColombo(follow.recommendedDate) : null;
      const oldDayEnd = oldDayStart ? new Date(oldDayStart) : null;
      if (oldDayEnd) oldDayEnd.setDate(oldDayEnd.getDate() + 1);

      const matchQuery = {
        patientId: req.user._id,
        visitReason: 'follow_up',
        status: { $ne: 'cancelled' },
        $or: [],
      };
      if (follow.patientAppointmentId) matchQuery.$or.push({ _id: follow.patientAppointmentId });
      if (follow.bookingRef) matchQuery.$or.push({ bookingRef: follow.bookingRef });
      if (oldDayStart && oldDayEnd) matchQuery.$or.push({ appointmentDate: { $gte: oldDayStart, $lt: oldDayEnd } });

      // if no match criteria (very unlikely), ensure array has something impossible to avoid matching everything
      if (matchQuery.$or.length === 0) matchQuery.$or.push({ _id: null });

      const matches = await Appointment.find(matchQuery).session(session);

      let appt = null;
      if (matches && matches.length > 0) {
        // user requested to delete the previous scheduled appointment and keep the new one
        for (let i = 0; i < matches.length; i++) {
          const oldAppt = matches[i];
          const oldDay = startOfDayColombo(oldAppt.appointmentDate);
          await DailySlot.updateOne({ doctorId: oldAppt.doctorId, slotDate: oldDay, bookedCount: { $gt: 0 } }, { $inc: { bookedCount: -1 } }).session(session);
          await Appointment.deleteOne({ _id: oldAppt._id }).session(session);
        }
      }

      // create new appointment
      appt = new Appointment({
        patientId: req.user._id,
        doctorId: doctorId,
        appointmentDate: dayStart,
        visitReason: 'follow_up',
        notes: '',
        bookingRef: follow.bookingRef || undefined,
        status: 'booked',
      });
      await appt.save({ session });

      if (targetDaily) {
        await DailySlot.updateOne({ _id: targetDaily._id }, { $inc: { bookedCount: 1 } }).session(session);
      } else {
        await DailySlot.create([{ doctorId, slotDate: dayStart, totalSlots: targetTotal, bookedCount: 1 }], { session });
      }

      // update follow-up to link appointment and mark patientRescheduled
      follow.recommendedDate = dayStart;
      follow.patientRescheduled = true;
      follow.patientRescheduledDate = dayStart;
      follow.patientAppointmentId = appt._id;
      await follow.save({ session });

      await session.commitTransaction();
      session.endSession();

      const updated = await FollowUp.findById(id).lean();
      const populatedAppt = await Appointment.findById(appt._id).populate({ path: 'doctorId', model: 'DoctorRoom', select: 'doctorName specialization room status' }).lean();
      res.json({ success: true, followUp: updated, appointment: populatedAppt });
      return;
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      throw innerErr;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to reschedule follow-up' });
  }
}
