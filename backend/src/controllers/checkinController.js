import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import QueueToken from '../models/QueueToken.js';
import DoctorRoom from '../models/DoctorRoom.js';
import {
  startOfDayColombo,
  formatYMD,
  nowColombo,
  isOperatingHoursForCheckin,
} from '../utils/dateUtils.js';

export async function checkIn(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { appointmentId } = req.params;
    const patientId = req.user._id;

    const appointment = await Appointment.findById(appointmentId).session(session);
    if (!appointment || String(appointment.patientId) !== String(patientId)) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status !== 'booked') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Appointment is not in booked status',
      });
    }

    const todayStr = formatYMD(nowColombo());
    const apptStr = formatYMD(appointment.appointmentDate);
    if (apptStr !== todayStr) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Check-in is only available on the appointment date',
      });
    }

    const hours = isOperatingHoursForCheckin();
    if (!hours.ok) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: hours.reason || 'Outside operating hours',
      });
    }

    // Queue availability is controlled by staff (DoctorRoom.status).
    // If there's no matching DoctorRoom record, default to allowing check-in (backward compatible).
    const doctorRoom = await DoctorRoom.findById(appointment.doctorId)
      .select('status queueEnabledAt')
      .lean()
      .session(session);

    if (doctorRoom && String(doctorRoom.status).toLowerCase() !== 'enabled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Still queue is not available',
        code: 'QUEUE_NOT_AVAILABLE',
      });
    }

    if (doctorRoom?.queueEnabledAt) {
      const CHECKIN_WINDOW_MS = 30 * 60 * 1000;
      const enabledAtMs = new Date(doctorRoom.queueEnabledAt).getTime();
      const closesAtMs = enabledAtMs + CHECKIN_WINDOW_MS;
      const nowMs = Date.now();
      if (nowMs > closesAtMs) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Check-in window closed',
          code: 'QUEUE_CHECKIN_CLOSED',
          checkinClosesAt: new Date(closesAtMs).toISOString(),
        });
      }
    }

    const existingToken = await QueueToken.findOne({ appointmentId }).session(session);
    if (existingToken) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Already checked in',
        tokenNumber: existingToken.tokenNumber,
      });
    }

    const todayStart = startOfDayColombo(nowColombo());
    const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const count = await QueueToken.countDocuments(
      {
        doctorId: appointment.doctorId,
        checkinTime: { $gte: todayStart, $lt: tomorrow },
      },
      { session }
    );

    const tokenNumber = `T-${String(count + 1).padStart(3, '0')}`;

    await QueueToken.create(
      [
        {
          appointmentId,
          doctorId: appointment.doctorId,
          tokenNumber,
        },
      ],
      { session }
    );

    appointment.status = 'checked_in';
    await appointment.save({ session });

    await session.commitTransaction();

    const waiting = await QueueToken.countDocuments({
      doctorId: appointment.doctorId,
      checkinTime: { $gte: todayStart, $lt: tomorrow },
      status: 'waiting',
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${String(appointment.doctorId)}`).emit('queue:update', {
        doctorId: String(appointment.doctorId),
        action: 'checkin',
        tokenNumber,
        totalWaiting: waiting,
        currentlyServing: '',
      });
    }

    const position = count + 1;
    const estimatedWaitMinutes = Math.max(0, (position - 1) * 5);

    res.json({
      success: true,
      tokenNumber,
      position,
      estimatedWaitMinutes,
    });
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Check-in failed' });
  } finally {
    session.endSession();
  }
}
