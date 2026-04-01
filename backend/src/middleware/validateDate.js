import {
  startOfDayColombo,
  getDayOfWeekColombo,
  totalSlotsForDate,
  formatYMD,
  nowColombo,
} from '../utils/dateUtils.js';
import SystemSettings from '../models/SystemSettings.js';

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

    // Enforce max advance booking window (default: 90 days ≈ 3 months)
    // If admin has configured maxAdvanceBookingDays, use that.
    let maxDays = 90;
    try {
      const s = await SystemSettings.findOne().select('maxAdvanceBookingDays').lean();
      if (s?.maxAdvanceBookingDays && Number.isFinite(Number(s.maxAdvanceBookingDays))) {
        maxDays = Number(s.maxAdvanceBookingDays);
      }
    } catch {
      // ignore settings load errors; use default
    }
    const maxDate = new Date(todayStart.getTime() + maxDays * 24 * 60 * 60 * 1000);
    if (dayStart > maxDate) {
      return res.status(400).json({
        success: false,
        message: `Appointments can only be booked up to ${maxDays} days in advance`,
      });
    }

    const totalSlots = totalSlotsForDate(dayStart);
    req.appointmentDayStart = dayStart;
    req.totalSlotsForDay = totalSlots;
    next();
  } catch (e) {
    next(e);
  }
}
