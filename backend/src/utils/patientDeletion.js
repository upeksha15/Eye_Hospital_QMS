import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import FollowUp from '../models/FollowUp.js';
import QueueToken from '../models/QueueToken.js';
import DailySlot from '../models/DailySlot.js';
import Patient from '../models/Patient.js';

/**
 * Permanently remove a patient and related records. Optionally runs inside a transaction session.
 */
export async function deletePatientCascade(patientId, session = null) {
  const opts = session ? { session } : {};
  const pid =
    patientId instanceof mongoose.Types.ObjectId
      ? patientId
      : new mongoose.Types.ObjectId(String(patientId));

  const q = Appointment.find({ patientId: pid });
  if (session) q.session(session);
  const appts = await q.lean();

  for (const appt of appts) {
    if (appt.status !== 'cancelled') {
      await DailySlot.findOneAndUpdate(
        {
          doctorId: appt.doctorId,
          slotDate: appt.appointmentDate,
          bookedCount: { $gt: 0 },
        },
        { $inc: { bookedCount: -1 } },
        opts
      );
    }
    await QueueToken.deleteMany({ appointmentId: appt._id }, opts);
  }

  await Appointment.deleteMany({ patientId: pid }, opts);
  await FollowUp.deleteMany({ patientId: pid }, opts);
  await Patient.findByIdAndDelete(pid, opts);
}
