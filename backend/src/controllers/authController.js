import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

function signToken(patientId) {
  return jwt.sign({ id: patientId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function stripPatient(p) {
  const o = p.toObject ? p.toObject() : { ...p };
  delete o.passwordHash;
  return o;
}

export async function register(req, res) {
  try {
    const { fullName, nic, dateOfBirth, contactNumber, email, password } = req.body;
    if (!fullName || !nic || !dateOfBirth || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, nic, dateOfBirth, and password are required',
      });
    }

    const exists = await Patient.findOne({
      $or: [{ nic: nic.trim() }, ...(email ? [{ email: email.trim().toLowerCase() }] : [])],
    });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'A patient with this NIC or email already exists',
      });
    }

    const emailNorm = email?.trim() ? email.trim().toLowerCase() : undefined;
    const passwordHash = await bcrypt.hash(password, 10);
    const patient = await Patient.create({
      fullName: fullName.trim(),
      nic: nic.trim(),
      dateOfBirth: new Date(dateOfBirth),
      contactNumber: contactNumber?.trim() || '',
      email: emailNorm,
      passwordHash,
    });

    const token = signToken(patient._id);
    res.status(201).json({
      success: true,
      token,
      patient: stripPatient(patient),
    });
  } catch (e) {
    console.error(e);
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate NIC or email' });
    }
    res.status(500).json({ success: false, message: e.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role = 'patient' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    // Validate role
    const validRoles = ['patient', 'admin', 'medical_staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    const emailTrim = email.trim().toLowerCase();
    let patient = await Patient.findOne({ email: emailTrim });

    if (!patient) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, patient.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Set or update the role
    patient.role = role;
    await patient.save();

    const token = signToken(patient._id);
    res.json({
      success: true,
      token,
      patient: stripPatient(patient),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Login failed' });
  }
}

export async function me(req, res) {
  res.json({ success: true, patient: stripPatient(req.user) });
}

export async function syncPatient(req, res) {
  try {
    const { fullName, contactNumber, profileImage } = req.body;
    const patientId = req.user._id;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID required' });
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient: stripPatient(patient),
    });
  } catch (error) {
    console.error('Sync patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync patient data' });
  }
}
