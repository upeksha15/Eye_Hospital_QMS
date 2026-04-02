import DoctorRoom from "../models/DoctorRoom.js";

const CHECKIN_WINDOW_MINUTES = 30;
const CHECKIN_WINDOW_MS = CHECKIN_WINDOW_MINUTES * 60 * 1000;

export const createDoctorRoom = async (req, res) => {
  try {
    const { doctorName, room, queueLimit, specialization, availability } = req.body;

    if (!doctorName || !room || queueLimit == null) {
      return res.status(400).json({ message: "doctorName, room and queueLimit are required" });
    }

    const newDoctorRoom = new DoctorRoom({
      doctorName,
      room,
      specialization,
      availability: Array.isArray(availability) ? availability : [],
      queueLimit,
    });

    const savedDoctorRoom = await newDoctorRoom.save();
    res.status(201).json(savedDoctorRoom);
  } catch (error) {
    console.error("Create Doctor Room Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllDoctorRooms = async (req, res) => {
  try {
    const doctorRooms = await DoctorRoom.find().sort({ createdAt: -1 });
    res.status(200).json(doctorRooms);
  } catch (error) {
    console.error("Get Doctor Rooms Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDoctorRoomById = async (req, res) => {
  try {
    const doctorRoom = await DoctorRoom.findById(req.params.id);

    if (!doctorRoom) {
      return res.status(404).json({ message: "Doctor room not found" });
    }

    res.status(200).json(doctorRoom);
  } catch (error) {
    console.error("Get Doctor Room By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDoctorRoom = async (req, res) => {
  try {
    const { doctorName, room, queueLimit, specialization, availability } = req.body;

    const patch = {};
    if (doctorName !== undefined) patch.doctorName = doctorName;
    if (room !== undefined) patch.room = room;
    if (specialization !== undefined) patch.specialization = specialization;
    if (availability !== undefined) patch.availability = Array.isArray(availability) ? availability : [];
    if (queueLimit !== undefined) patch.queueLimit = queueLimit;

    const updatedDoctorRoom = await DoctorRoom.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });

    if (!updatedDoctorRoom) {
      return res.status(404).json({ message: "Doctor room not found" });
    }

    res.status(200).json(updatedDoctorRoom);
  } catch (error) {
    console.error("Update Doctor Room Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteDoctorRoom = async (req, res) => {
  try {
    const deletedDoctorRoom = await DoctorRoom.findByIdAndDelete(req.params.id);

    if (!deletedDoctorRoom) {
      return res.status(404).json({ message: "Doctor room not found" });
    }

    res.status(200).json({ message: "Doctor room deleted successfully" });
  } catch (error) {
    console.error("Delete Doctor Room Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSpecializations = async (req, res) => {
  try {
    // Get distinct specialization values and sort them
    const specs = await DoctorRoom.distinct('specialization');
    const cleaned = (specs || []).map(s => (s || '').trim()).filter(Boolean);
    const unique = Array.from(new Set(cleaned)).sort();
    res.status(200).json(unique);
  } catch (error) {
    console.error('Get Specializations Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

  // --- status controls ---
  export const enableDoctorRoom = async (req, res) => {
    try {
      const enabledAt = new Date();
      const updated = await DoctorRoom.findByIdAndUpdate(
        req.params.id,
        { status: 'Enabled', queueEnabledAt: enabledAt },
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: 'Doctor room not found' });
    try {
      const io = req.app.get('io');
      io?.to(`queue:${String(updated._id)}`).emit('queue:status', {
        doctorId: String(updated._id),
        status: 'Enabled',
        queueEnabledAt: enabledAt.toISOString(),
        checkinClosesAt: new Date(enabledAt.getTime() + CHECKIN_WINDOW_MS).toISOString(),
        checkinWindowMinutes: CHECKIN_WINDOW_MINUTES,
      });
    } catch (e) {
      // ignore socket emit errors
    }
      res.status(200).json(updated);
    } catch (err) {
      console.error('Enable Doctor Room Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const disableDoctorRoom = async (req, res) => {
    try {
      const updated = await DoctorRoom.findByIdAndUpdate(req.params.id, { status: 'Disabled' }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Doctor room not found' });
    try {
      const io = req.app.get('io');
      io?.to(`queue:${String(updated._id)}`).emit('queue:status', { doctorId: String(updated._id), status: 'Disabled' });
    } catch (e) {
      // ignore socket emit errors
    }
      res.status(200).json(updated);
    } catch (err) {
      console.error('Disable Doctor Room Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const pauseDoctorRoom = async (req, res) => {
    try {
      const updated = await DoctorRoom.findByIdAndUpdate(req.params.id, { status: 'Paused' }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Doctor room not found' });
    try {
      const io = req.app.get('io');
      io?.to(`queue:${String(updated._id)}`).emit('queue:status', { doctorId: String(updated._id), status: 'Paused' });
    } catch (e) {
      // ignore socket emit errors
    }
      res.status(200).json(updated);
    } catch (err) {
      console.error('Pause Doctor Room Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  export const resumeDoctorRoom = async (req, res) => {
    try {
      const updated = await DoctorRoom.findByIdAndUpdate(req.params.id, { status: 'Enabled' }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Doctor room not found' });
    try {
      const io = req.app.get('io');
      io?.to(`queue:${String(updated._id)}`).emit('queue:status', { doctorId: String(updated._id), status: 'Enabled' });
    } catch (e) {
      // ignore socket emit errors
    }
      res.status(200).json(updated);
    } catch (err) {
      console.error('Resume Doctor Room Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };