import DailySlot from '../models/DailySlot.js';
import {
  startOfDayColombo,
  getDayOfWeekColombo,
  totalSlotsForDate,
  formatYMD,
} from '../utils/dateUtils.js';
import DoctorRoom from '../models/DoctorRoom.js';

export async function getSlotsForDoctorMonth(req, res) {
  try {
    const { doctorId } = req.params;
    const month = req.query.month;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Query param month=YYYY-MM is required',
      });
    }

    const [y, mo] = month.split('-').map(Number);
    const daysInMonth = new Date(y, mo, 0).getDate();

    const first = startOfDayColombo(new Date(Date.UTC(y, mo - 1, 1, 12, 0, 0)));
    const last = startOfDayColombo(new Date(Date.UTC(y, mo - 1, daysInMonth, 12, 0, 0)));

    const slots = await DailySlot.find({
      doctorId,
      slotDate: { $gte: first, $lte: last },
    }).lean();

    const byDate = new Map(slots.map((s) => [formatYMD(s.slotDate), s]));

    // load doctor room settings (availability, slotLimit)
    const doctorRoom = await DoctorRoom.findById(doctorId).lean();

    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = startOfDayColombo(new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)));
      const dow = getDayOfWeekColombo(dayStart);
      const key = formatYMD(dayStart);
      const doc = byDate.get(key);

      // determine weekday name (Sunday..Saturday) to match DoctorRoom.availability values
      const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekdayName = WEEKDAY_NAMES[dow] || '';

      // If doctorRoom exists, only allow days present in its availability array.
      let allowedByDoctor = true;
      if (doctorRoom) {
        const avail = Array.isArray(doctorRoom.availability) ? doctorRoom.availability : [];
        allowedByDoctor = avail.includes(weekdayName);
      } else {
        // fallback: keep original behavior that blocks Sundays
        allowedByDoctor = dow !== 0;
      }

      if (!allowedByDoctor) {
        result.push({
          date: key,
          totalSlots: 0,
          bookedCount: 0,
          available: 0,
          isSaturday: dow === 6,
          isFull: true,
        });
        continue;
      }

      // allowed day: compute total from DailySlot override or doctor's slotLimit or default
      const total = doc?.totalSlots ?? (doctorRoom?.slotLimit ?? totalSlotsForDate(dayStart));
      const booked = doc?.bookedCount ?? 0;
      const available = Math.max(0, total - booked);
      const isSaturday = dow === 6;

      result.push({
        date: key,
        totalSlots: total,
        bookedCount: booked,
        available,
        isSaturday,
        isFull: available === 0,
      });
    }

    res.json({ success: true, slots: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Failed to load slots' });
  }
}
