import QueueToken from '../models/QueueToken.js';
import Appointment from '../models/Appointment.js';
import DoctorRoom from '../models/DoctorRoom.js';
import mongoose from 'mongoose';
import { startOfDayColombo, nowColombo } from '../utils/dateUtils.js';

// helper to compute today bounds
function todayBounds() {
  const todayStart = startOfDayColombo(nowColombo());
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { todayStart, tomorrow };
}

const ESTIMATED_WAIT_PER_PATIENT = 5;
const CHECKIN_WINDOW_MINUTES = 30;
const CHECKIN_WINDOW_MS = CHECKIN_WINDOW_MINUTES * 60 * 1000;

function computeCheckinWindow(doctorRoom) {
  let status = doctorRoom?.status || 'Disabled';
  const enabledAt = doctorRoom?.queueEnabledAt ? new Date(doctorRoom.queueEnabledAt) : null;
  if (String(status).toLowerCase() === 'enabled' && !enabledAt) {
    status = 'Disabled';
  }
  const closesAt = enabledAt ? new Date(enabledAt.getTime() + CHECKIN_WINDOW_MS) : null;
  const nowMs = Date.now();
  const checkinOpen = String(status).toLowerCase() === 'enabled' && Boolean(closesAt) && nowMs <= closesAt.getTime();
  const remainingMinutes = closesAt ? Math.max(0, Math.ceil((closesAt.getTime() - nowMs) / 60000)) : null;
  return {
    queueStatus: status,
    queueEnabledAt: enabledAt ? enabledAt.toISOString() : null,
    checkinClosesAt: closesAt ? closesAt.toISOString() : null,
    checkinWindowMinutes: CHECKIN_WINDOW_MINUTES,
    checkinOpen,
    remainingMinutes,
  };
}

function ensureValidDoctorId(req, res, doctorId) {
  if (!mongoose.Types.ObjectId.isValid(String(doctorId))) {
    res.status(400).json({ success: false, message: 'Invalid doctor id' });
    return false;
  }
  return true;
}

export async function getQueueToday(req, res) {
  try {
    const { doctorId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    const todayStart = startOfDayColombo(nowColombo());
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tokens = await QueueToken.find({
      doctorId,
      checkinTime: { $gte: todayStart, $lt: tomorrow },
    })
      .sort({ checkinTime: 1 })
      .lean();

    const waiting = tokens.filter((t) => t.status === 'waiting').length;
    const completed = tokens.filter((t) => t.status === 'completed').length;
    const called = tokens.find((t) => t.status === 'called');
    const currentlyServing = called?.tokenNumber || '';

    const doctorRoom = await DoctorRoom.findById(doctorId).select('status queueEnabledAt').lean();
    const window = computeCheckinWindow(doctorRoom);

    res.json({
      success: true,
      status: window.queueStatus,
      queueEnabledAt: window.queueEnabledAt,
      checkinClosesAt: window.checkinClosesAt,
      checkinWindowMinutes: window.checkinWindowMinutes,
      checkinOpen: window.checkinOpen,
      remainingMinutes: window.remainingMinutes,
      currentlyServing: currentlyServing || '',
      totalInQueue: tokens.length,
      waiting,
      completed,
      estimatedWaitPerPatient: ESTIMATED_WAIT_PER_PATIENT,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Queue load failed' });
  }
}

export async function getQueueBoardToday(req, res) {
  try {
    const { doctorId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    const { todayStart, tomorrow } = todayBounds();

    const doctorRoom = await DoctorRoom.findById(doctorId).select('status queueEnabledAt doctorName room specialization').lean();
    const window = computeCheckinWindow(doctorRoom);

    const tokens = await QueueToken.find({
      doctorId,
      checkinTime: { $gte: todayStart, $lt: tomorrow },
      status: { $in: ['waiting', 'called'] },
    })
      .populate({
        path: 'appointmentId',
        select: 'patientId',
        populate: { path: 'patientId', select: 'fullName' },
      })
      .sort({ checkinTime: 1 })
      .lean();

    const called = tokens.find((t) => t.status === 'called');
    const currentlyServing = called?.tokenNumber || '';

    const queueList = tokens.map((t) => ({
      _id: String(t._id),
      tokenNumber: t.tokenNumber,
      status: t.status,
      checkinTime: t.checkinTime,
      patientName: t.appointmentId?.patientId?.fullName || 'Patient',
    }));

    res.json({
      success: true,
      doctor: doctorRoom
        ? {
            _id: String(doctorId),
            doctorName: doctorRoom.doctorName,
            room: doctorRoom.room,
            specialization: doctorRoom.specialization,
          }
        : { _id: String(doctorId) },
      status: window.queueStatus,
      queueEnabledAt: window.queueEnabledAt,
      checkinClosesAt: window.checkinClosesAt,
      checkinWindowMinutes: window.checkinWindowMinutes,
      checkinOpen: window.checkinOpen,
      remainingMinutes: window.remainingMinutes,
      currentlyServing,
      estimatedWaitPerPatient: ESTIMATED_WAIT_PER_PATIENT,
      tokens: queueList,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Queue board load failed' });
  }
}

export async function getMyQueueStatusToday(req, res) {
  try {
    const { doctorId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    const patientId = req.user._id;
    const { todayStart, tomorrow } = todayBounds();

    const appt = await Appointment.findOne({
      patientId,
      doctorId,
      appointmentDate: { $gte: todayStart, $lt: tomorrow },
    })
      .select('_id status appointmentDate doctorId')
      .lean();

    if (!appt) {
      return res.status(404).json({ success: false, message: 'No appointment found for today' });
    }

    const doctorRoom = await DoctorRoom.findById(doctorId).select('status queueEnabledAt').lean();
    const window = computeCheckinWindow(doctorRoom);

    const token = await QueueToken.findOne({ appointmentId: appt._id }).lean();

    const waitingTokens = await QueueToken.find({
      doctorId,
      checkinTime: { $gte: todayStart, $lt: tomorrow },
      status: { $in: ['waiting', 'called'] },
    })
      .sort({ checkinTime: 1 })
      .select('tokenNumber status appointmentId checkinTime')
      .lean();

    const called = waitingTokens.find((t) => t.status === 'called');
    const currentlyServing = called?.tokenNumber || '';

    let position = null;
    if (token) {
      const idx = waitingTokens.findIndex((t) => String(t.appointmentId) === String(appt._id));
      position = idx >= 0 ? idx + 1 : null;
    }

    const estimatedWaitMinutes =
      position && position > 1 ? (position - 1) * ESTIMATED_WAIT_PER_PATIENT : 0;

    res.json({
      success: true,
      queueStatus: window.queueStatus,
      queueEnabledAt: window.queueEnabledAt,
      checkinClosesAt: window.checkinClosesAt,
      checkinWindowMinutes: window.checkinWindowMinutes,
      checkinOpen: window.checkinOpen,
      remainingMinutes: window.remainingMinutes,
      appointment: appt,
      tokenNumber: token?.tokenNumber || null,
      position,
      currentlyServing,
      estimatedWaitMinutes,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load my queue status' });
  }
}

export async function callNextPatient(req, res) {
  try {
    const { doctorId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    const { todayStart, tomorrow } = todayBounds();

    // complete any currently called token
    const current = await QueueToken.findOne({
      doctorId,
      status: 'called',
      checkinTime: { $gte: todayStart, $lt: tomorrow },
    }).sort({ checkinTime: 1 });

    if (current) {
      current.status = 'completed';
      await current.save();
    }

    // find next waiting and mark called
    const next = await QueueToken.findOneAndUpdate(
      {
        doctorId,
        status: 'waiting',
        checkinTime: { $gte: todayStart, $lt: tomorrow },
      },
      { status: 'called' },
      { sort: { checkinTime: 1 }, new: true }
    );

    const totalWaiting = await QueueToken.countDocuments({ doctorId, status: 'waiting', checkinTime: { $gte: todayStart, $lt: tomorrow } });

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${String(doctorId)}`).emit('queue:update', {
        doctorId: String(doctorId),
        action: 'callNext',
        currentlyServing: next ? next.tokenNumber : '',
        totalWaiting,
      });
    }

    res.json({ success: true, token: next || null, totalWaiting });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'callNext failed' });
  }
}

export async function skipCurrentPatient(req, res) {
  try {
    const { doctorId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    const { todayStart, tomorrow } = todayBounds();

    const current = await QueueToken.findOne({ doctorId, status: 'called', checkinTime: { $gte: todayStart, $lt: tomorrow } }).sort({ checkinTime: 1 });
    if (!current) return res.status(404).json({ success: false, message: 'No currently called patient' });

    current.status = 'absent';
    await current.save();

    // after skipping, call next automatically
    const next = await QueueToken.findOneAndUpdate(
      {
        doctorId,
        status: 'waiting',
        checkinTime: { $gte: todayStart, $lt: tomorrow },
      },
      { status: 'called' },
      { sort: { checkinTime: 1 }, new: true }
    );

    const totalWaiting = await QueueToken.countDocuments({ doctorId, status: 'waiting', checkinTime: { $gte: todayStart, $lt: tomorrow } });

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${String(doctorId)}`).emit('queue:update', {
        doctorId: String(doctorId),
        action: 'skip',
        skippedToken: current.tokenNumber,
        currentlyServing: next ? next.tokenNumber : '',
        totalWaiting,
      });
    }

    res.json({ success: true, skipped: current, next: next || null, totalWaiting });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'skip failed' });
  }
}

export async function removePatientFromQueue(req, res) {
  try {
    const { doctorId, tokenId } = req.params;
    if (!ensureValidDoctorId(req, res, doctorId)) return;
    if (!mongoose.Types.ObjectId.isValid(String(tokenId))) {
      return res.status(400).json({ success: false, message: 'Invalid token id' });
    }
    const { todayStart, tomorrow } = todayBounds();

    const token = await QueueToken.findOne({ _id: tokenId, doctorId, checkinTime: { $gte: todayStart, $lt: tomorrow } });
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    token.status = 'absent';
    await token.save();

    const totalWaiting = await QueueToken.countDocuments({ doctorId, status: 'waiting', checkinTime: { $gte: todayStart, $lt: tomorrow } });

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${String(doctorId)}`).emit('queue:update', {
        doctorId: String(doctorId),
        action: 'remove',
        removedToken: token.tokenNumber,
        totalWaiting,
      });
    }

    res.json({ success: true, removed: token, totalWaiting });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'remove failed' });
  }
}
