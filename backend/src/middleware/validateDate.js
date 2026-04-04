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
    const doctorId = req.body?.doctorId || req.query?.doctorId;

    // If this is a Sunday, allow only when the selected doctor explicitly lists Sunday
    if (dow === 0) {
      if (doctorId) {
        try {
          const dr = await DoctorRoom.findById(doctorId).lean();
          const avail = Array.isArray(dr?.availability) ? dr.availability : [];
          if (!avail.includes('Sunday')) {
            return res.status(400).json({ success: false, message: 'Appointments are not available on Sunday for this doctor' });
          }
        } catch (e) {
          console.warn('validateDate: failed to read doctor room for Sunday availability', e?.message || e);
          return res.status(400).json({ success: false, message: 'Appointments are not available on Sunday' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Appointments are not available on Sunday' });
      }
    }

    const todayStart = startOfDayColombo(nowColombo());
    if (dayStart < todayStart) {
      return res.status(400).json({ success: false, message: 'Cannot book a past date' });
    }

    // No special same-day Saturday booking restriction

    let totalSlots = totalSlotsForDate(dayStart);

    // If a doctorId was provided, cap total slots by the doctor's queueLimit
    if (doctorId) {
      try {
        const dr2 = await DoctorRoom.findById(doctorId).lean();
        if (dr2 && typeof dr2.queueLimit === 'number') {
          totalSlots = Math.min(totalSlots, dr2.queueLimit);
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
