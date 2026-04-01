import QueueToken from '../models/QueueToken.js';
import { startOfDayColombo, nowColombo } from '../utils/dateUtils.js';

// helper to compute today bounds
function todayBounds() {
  const todayStart = startOfDayColombo(nowColombo());
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { todayStart, tomorrow };
}

const ESTIMATED_WAIT_PER_PATIENT = 5;

export async function getQueueToday(req, res) {
  try {
    const { doctorId } = req.params;
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

    res.json({
      success: true,
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

export async function callNextPatient(req, res) {
  try {
    const { doctorId } = req.params;
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
      io.emit('queue:update', {
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
      io.emit('queue:update', {
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
    const { todayStart, tomorrow } = todayBounds();

    const token = await QueueToken.findOne({ _id: tokenId, doctorId, checkinTime: { $gte: todayStart, $lt: tomorrow } });
    if (!token) return res.status(404).json({ success: false, message: 'Token not found' });

    token.status = 'absent';
    await token.save();

    const totalWaiting = await QueueToken.countDocuments({ doctorId, status: 'waiting', checkinTime: { $gte: todayStart, $lt: tomorrow } });

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:update', {
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
