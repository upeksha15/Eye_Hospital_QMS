import DailySlot from '../models/DailySlot.js';

export async function checkSlotAvailability(req, res, next) {
  try {
    const { doctorId } = req.body;
    const dayStart = req.appointmentDayStart;
    const totalSlots = req.totalSlotsForDay;

    let slot = await DailySlot.findOneAndUpdate(
      {
        doctorId,
        slotDate: dayStart,
        $expr: { $lt: ['$bookedCount', '$totalSlots'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (slot) {
      req.dailySlotDoc = slot;
      return next();
    }

    const existing = await DailySlot.findOne({ doctorId, slotDate: dayStart });
    if (existing && existing.bookedCount >= existing.totalSlots) {
      return res.status(400).json({
        success: false,
        message: 'No slots available for this date',
      });
    }

    try {
      slot = await DailySlot.create({
        doctorId,
        slotDate: dayStart,
        totalSlots,
        bookedCount: 1,
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      slot = await DailySlot.findOneAndUpdate(
        {
          doctorId,
          slotDate: dayStart,
          $expr: { $lt: ['$bookedCount', '$totalSlots'] },
        },
        { $inc: { bookedCount: 1 } },
        { new: true }
      );
    }

    if (!slot || slot.bookedCount > slot.totalSlots) {
      if (slot?._id) {
        await DailySlot.updateOne({ _id: slot._id }, { $inc: { bookedCount: -1 } });
      }
      return res.status(400).json({
        success: false,
        message: 'No slots available for this date',
      });
    }

    req.dailySlotDoc = slot;
    next();
  } catch (e) {
    next(e);
  }
}
