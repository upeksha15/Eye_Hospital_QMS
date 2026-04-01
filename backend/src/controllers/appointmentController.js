import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import DailySlot from '../models/DailySlot.js';
import Patient from '../models/Patient.js';
import DoctorRoom from '../models/DoctorRoom.js';
import { formatYMD, nowColombo } from '../utils/dateUtils.js';

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

    let bookingRef;
    try {
      bookingRef = await generateBookingRef();
    } catch (e) {
      await DailySlot.updateOne(
        { _id: req.dailySlotDoc._id },
        { $inc: { bookedCount: -1 } }
      );
      throw e;
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        patientId,
        doctorId,
        appointmentDate: dayStart,
        visitReason,
        notes: notes || '',
        bookingRef,
        status: 'booked',
      });
    } catch (e) {
      await DailySlot.updateOne(
        { _id: req.dailySlotDoc._id },
        { $inc: { bookedCount: -1 } }
      );
      if (e.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Could not generate unique booking reference. Try again.',
        });
      }
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
    res.json({ success: true, appointments: list });
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
