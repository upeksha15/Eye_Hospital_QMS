import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import DailySlot from '../models/DailySlot.js';
import Patient from '../models/Patient.js';
import DoctorRoom from '../models/DoctorRoom.js';
import FollowUp from '../models/FollowUp.js';
import { formatYMD, nowColombo, startOfDayColombo, getDayOfWeekColombo, totalSlotsForDate } from '../utils/dateUtils.js';

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

export async function createAppointment(req, res) {
  try {
    const { doctorId, appointmentDate, visitReason, notes, fullName, dateOfBirth, contactNumber } = req.body;
    const patientId = req.user._id;
    const dayStart = req.appointmentDayStart;

    // Prevent duplicate bookings for the same patient on the same day across all doctors
    try {
      const existing = await Appointment.findOne({
        patientId,
        appointmentDate: dayStart,
        status: { $ne: 'cancelled' },
      }).lean();
      if (existing) {
        return res.status(400).json({ success: false, message: 'This patient already has an appointment scheduled for this day.' });
      }
    } catch (dupErr) {
      // ignore duplicate-check DB errors and proceed (will fail later if necessary)
      console.warn('createAppointment: duplicate check failed', dupErr?.message || dupErr);
    }

    // If frontend supplied updated patient info, persist it (do not update NIC here)
    try {
      const updates = {};
      if (fullName) updates.fullName = fullName;
      if (dateOfBirth) updates.dateOfBirth = new Date(dateOfBirth);
      if (contactNumber) updates.contactNumber = contactNumber;
      if (Object.keys(updates).length > 0) {
        await Patient.findByIdAndUpdate(patientId, updates, { runValidators: true });
      }
    } catch (uErr) {
      console.warn('Failed to update patient data during booking:', uErr.message || uErr);
    }

    // Attempt to create the appointment with a unique bookingRef.
    // Retry a few times if a duplicate-key error occurs (race condition).
    const MAX_REF_ATTEMPTS = 5;
    let appointment = null;
    try {
      for (let attempt = 0; attempt < MAX_REF_ATTEMPTS; attempt++) {
        let ref = await generateBookingRef();
        // On retries, append a small random suffix to reduce collision chance
        if (attempt > 0) {
          const suffix = Math.floor(Math.random() * 900) + 100; // 100-999
          ref = `${ref}-${suffix}`;
        }

        try {
          appointment = await Appointment.create({
            patientId,
            doctorId,
            appointmentDate: dayStart,
            visitReason,
            notes: notes || '',
            bookingRef: ref,
            status: 'booked',
          });
          break; // success
        } catch (errCreate) {
          // If duplicate key, retry; otherwise propagate
          if (errCreate.code === 11000) {
            // last attempt -> rollback bookedCount and notify client
            if (attempt === MAX_REF_ATTEMPTS - 1) {
              if (req.dailySlotDoc && req.dailySlotDoc._id) {
                await DailySlot.updateOne({ _id: req.dailySlotDoc._id }, { $inc: { bookedCount: -1 } });
              }
              return res.status(400).json({ success: false, message: 'Could not generate unique booking reference. Try again.' });
            }
            // otherwise continue to next attempt
            continue;
          }
          // non-duplicate error: rollback and rethrow
          if (req.dailySlotDoc && req.dailySlotDoc._id) {
            await DailySlot.updateOne({ _id: req.dailySlotDoc._id }, { $inc: { bookedCount: -1 } });
          }
          throw errCreate;
        }
      }
    } catch (e) {
      throw e;
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'doctorId', model: 'DoctorRoom', select: 'doctorName specialization room status' })
      .lean();

    // Emit socket event to notify clients about slot change for this doctor/date
    try {
      const io = req.app.get('io');
      if (io && req.dailySlotDoc) {
        const payload = {
          doctorId: String(appointment.doctorId),
          slotDate: formatYMD(req.dailySlotDoc.slotDate),
          bookedCount: req.dailySlotDoc.bookedCount,
          totalSlots: req.dailySlotDoc.totalSlots,
        };
        io.emit('slots:update', payload);
      }
    } catch (emitErr) {
      console.warn('Failed to emit slots:update', emitErr);
    }

    res.status(201).json({
      success: true,
      message: 'Token will be assigned at check-in',
      appointment: populated,
      bookingRef: appointment.bookingRef,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Booking failed' });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const list = await Appointment.find({ patientId: req.user._id })
      .populate({ path: 'doctorId', model: 'DoctorRoom', select: 'doctorName specialization room status' })
      .sort({ appointmentDate: -1 })
      .lean();

    // Also include follow-ups that were scheduled by staff but not yet converted to an Appointment
    const nic = req.user.nic || req.user.NIC || '';
    const followQuery = { status: 'scheduled', patientRescheduled: { $ne: true } };
    followQuery.$or = [];
    followQuery.$or.push({ patientId: req.user._id });
    if (nic) followQuery.$or.push({ patientNIC: nic });

    const followUps = await FollowUp.find(followQuery).sort({ recommendedDate: 1 }).lean();

    // populate doctor room info for follow-ups
    const doctorIds = Array.from(new Set((followUps || []).map((f) => String(f.doctorId)).filter(Boolean)));
    const doctorRooms = await DoctorRoom.find({ _id: { $in: doctorIds } }).lean();
    const drMap = doctorRooms.reduce((acc, d) => { acc[String(d._id)] = d; return acc; }, {});

    // Map follow-ups to appointment-like objects so frontend shows them in My Appointments
    const mappedFollowUps = (followUps || []).map((f) => ({
      _id: `follow-${f._id}`,
      patientId: f.patientId,
      doctorId: drMap[String(f.doctorId)] || { doctorName: f.doctorName, specialization: '' },
      appointmentDate: f.recommendedDate,
      visitReason: 'follow_up',
      status: 'scheduled',
      isFollowUp: true,
      followUpId: f._id,
      bookingRef: f.bookingRef,
    }));

    // normalize appointments to match frontend expected shape and merge
    const normalizedAppointments = (list || []).map((a) => ({ ...a, isFollowUp: false }));
    const merged = [...normalizedAppointments, ...mappedFollowUps].sort((x, y) => new Date(y.appointmentDate) - new Date(x.appointmentDate));

    res.json({ success: true, appointments: merged });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load appointments' });
  }
}

export async function getAppointmentById(req, res) {
  try {
    const appt = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    })
      .populate({ path: 'doctorId', model: 'DoctorRoom', select: 'doctorName specialization room status' })
      .lean();

    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, appointment: appt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load appointment' });
  }
}

export async function cancelAppointment(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const appt = await Appointment.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    }).session(session);

    if (!appt) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appt.status !== 'booked') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Only booked appointments can be cancelled',
      });
    }

    const todayStr = formatYMD(nowColombo());
    const apptStr = formatYMD(appt.appointmentDate);

    if (apptStr <= todayStr) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointments on or before today',
      });
    }

    appt.status = 'cancelled';
    await appt.save({ session });

    await DailySlot.findOneAndUpdate(
      {
        doctorId: appt.doctorId,
        slotDate: appt.appointmentDate,
        bookedCount: { $gt: 0 },
      },
      { $inc: { bookedCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Cancel failed' });
  } finally {
    session.endSession();
  }
}

export async function getAppointmentsByDate(req, res) {
  try {
    if (req.userType !== 'staff') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const dateStr = req.query.date;
    if (!dateStr) {
      return res.status(400).json({ success: false, message: 'Missing date parameter' });
    }

    const dayStart = startOfDayColombo(dateStr);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const list = await Appointment.find({
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
    })
      .populate({ path: 'patientId', model: 'Patient', select: 'fullName contactNumber nic' })
      .populate({ path: 'doctorId', model: 'DoctorRoom', select: 'doctorName' })
      .sort({ appointmentDate: 1 })
      .lean();

    // map to a simpler shape
    const mapped = (list || []).map((a) => ({
      _id: a._id,
      patientName: a.patientId?.fullName || a.patientId || '',
      patientNIC: a.patientId?.nic || '',
      patientContact: a.patientId?.contactNumber || '',
      doctorId: a.doctorId?._id || null,
      doctorName: a.doctorId?.doctorName || a.doctorId?.fullName || a.doctorId || '',
      appointmentDate: a.appointmentDate,
      visitReason: a.visitReason,
      status: a.status,
    }));

    res.json({ success: true, appointments: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load appointments' });
  }
}

export async function checkAvailability(req, res) {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' });
    }

    const dayStart = startOfDayColombo(date);

    // load doctor room
    const doctorRoom = await DoctorRoom.findById(doctorId).lean();

    // determine weekday name
    const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dow = getDayOfWeekColombo(dayStart);
    const weekdayName = WEEKDAY_NAMES[dow] || '';

    // check availability
    let isAvailable = true;
    if (doctorRoom) {
      const avail = Array.isArray(doctorRoom.availability) ? doctorRoom.availability : [];
      isAvailable = avail.includes(weekdayName);
    } else {
      // fallback: closed on Sundays
      isAvailable = dow !== 0;
    }

    // compute total slots (DailySlot override or default), cap by doctor queueLimit if present
    const daily = await DailySlot.findOne({ doctorId, slotDate: dayStart }).lean();
    let total = daily?.totalSlots ?? totalSlotsForDate(dayStart);
    if (doctorRoom && typeof doctorRoom.queueLimit === 'number') {
      total = Math.min(total, doctorRoom.queueLimit);
    }

    // count existing appointments (exclude cancelled)
    const existing = await Appointment.countDocuments({ doctorId, appointmentDate: dayStart, status: { $ne: 'cancelled' } });
    const isQueueFull = existing >= total;
    const remainingSlots = Math.max(0, total - existing);

    res.json({
      success: true,
      isAvailable,
      isQueueFull,
      totalSlots: total,
      bookedCount: existing,
      remainingSlots,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to check availability' });
  }
}
