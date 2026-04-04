import {
  startOfDayColombo,
  getDayOfWeekColombo,
  totalSlotsForDate,
  formatYMD,
  nowColombo,
} from '../utils/dateUtils.js';
import DoctorRoom from '../models/DoctorRoom.js';

export async function validateAppointmentDate(req, res, next) {
  try {
    const { appointmentDate } = req.body;
    if (!appointmentDate) {
      return res.status(400).json({ success: false, message: 'appointmentDate is required' });
    }

    const appt = new Date(appointmentDate);
    if (Number.isNaN(appt.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointmentDate' });
    }

    const dayStart = startOfDayColombo(appt);
    const dow = getDayOfWeekColombo(dayStart);

    if (dow === 0) {
      return res.status(400).json({ success: false, message: 'Appointments are not available on Sunday' });
    }

    const todayStart = startOfDayColombo(nowColombo());
    if (dayStart < todayStart) {
      return res.status(400).json({ success: false, message: 'Cannot book a past date' });
    }

    if (dow === 6) {
      const now = nowColombo();
      const sameDay = formatYMD(now) === formatYMD(dayStart);
      if (sameDay) {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(now);
        const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
        const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
        const minutes = hh * 60 + mm;
        if (minutes >= 10 * 60) {
          return res.status(400).json({
            success: false,
            message: 'Saturday bookings for today are only accepted before 10:00 AM',
          });
        }
      }
    }

    let totalSlots = totalSlotsForDate(dayStart);

    // If a doctorId was provided, cap total slots by the doctor's queueLimit
    const doctorId = req.body?.doctorId || req.query?.doctorId;
    if (doctorId) {
      try {
        const dr = await DoctorRoom.findById(doctorId).lean();
        if (dr && typeof dr.queueLimit === 'number') {
          totalSlots = Math.min(totalSlots, dr.queueLimit);
        }
      } catch (err) {
        // ignore DB errors here and fall back to default totalSlots
        console.warn('validateDate: failed to read doctor room for queueLimit', err?.message || err);
      }
    }

    req.appointmentDayStart = dayStart;
    req.totalSlotsForDay = totalSlots;
    next();
  } catch (e) {
    next(e);
  }
}
