import QueueToken from '../models/QueueToken.js';
import { startOfDayColombo, nowColombo } from '../utils/dateUtils.js';

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
