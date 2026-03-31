import DoctorRoom from "../models/DoctorRoom.js";

export const createDoctorRoom = async (req, res) => {
  try {
    const { doctorName, room, slotLimit, queueLimit, specialization, availability } = req.body;

    if (!doctorName || !room || !slotLimit || !queueLimit) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newDoctorRoom = new DoctorRoom({
      doctorName,
      room,
      specialization,
      availability: Array.isArray(availability) ? availability : [],
      slotLimit,
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
    const { doctorName, room, slotLimit, queueLimit, specialization, availability } = req.body;

    const updatedDoctorRoom = await DoctorRoom.findByIdAndUpdate(
      req.params.id,
      {
        doctorName,
        room,
        specialization,
        availability: Array.isArray(availability) ? availability : [],
        slotLimit,
        queueLimit,
      },
      { new: true, runValidators: true }
    );

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
      const updated = await DoctorRoom.findByIdAndUpdate(req.params.id, { status: 'Enabled' }, { new: true });
      if (!updated) return res.status(404).json({ message: 'Doctor room not found' });
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
      res.status(200).json(updated);
    } catch (err) {
      console.error('Resume Doctor Room Error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };