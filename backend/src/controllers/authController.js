import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import StaffAccount from '../models/StaffAccount.js';
import { ensureDbConnected } from '../../config/db.js';

function signToken(id, typ) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured on the server');
  }
  return jwt.sign({ id: id.toString(), typ }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function stripPatient(p) {
  const o = p.toObject ? p.toObject() : { ...p };
  delete o.passwordHash;
  o.userType = 'patient';
  return o;
}

function stripStaff(s) {
  const o = s.toObject ? s.toObject() : { ...s };
  delete o.passwordHash;
  o.userType = 'staff';
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

    // ensure DB connection when buffering is disabled
    await ensureDbConnected();

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

    const token = signToken(patient._id, 'patient');
    const user = stripPatient(patient);
    res.status(201).json({
      success: true,
      token,
      patient: user,
      user,
      userType: 'patient',
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

    const validRoles = ['patient', 'admin', 'medical_staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    const emailTrim = email.trim().toLowerCase();

    // Ensure DB connection before attempting any user lookups
    await ensureDbConnected();

    if (role === 'patient') {
      await ensureDbConnected();
      const patient = await Patient.findOne({ email: emailTrim });
      if (!patient) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const ok = await bcrypt.compare(password, patient.passwordHash);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(patient._id, 'patient');
      const user = stripPatient(patient);
      return res.json({
        success: true,
        token,
        patient: user,
        user,
        userType: 'patient',
      });
    }

    if (role === 'admin' || role === 'medical_staff') {
      const staff = await StaffAccount.findOne({ email: emailTrim });
      if (!staff || !staff.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (staff.role !== role) {
        return res.status(401).json({
          success: false,
          message: 'This account does not match the selected role',
        });
      }
      const ok = await staff.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(staff._id, 'staff');
      const user = stripStaff(staff);
      return res.json({
        success: true,
        token,
        patient: user,
        user,
        userType: 'staff',
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid role' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message || 'Login failed' });
  }
}

export async function me(req, res) {
  if (req.userType === 'staff') {
    return res.json({ success: true, patient: stripStaff(req.user), user: stripStaff(req.user), userType: 'staff' });
  }
  return res.json({ success: true, patient: stripPatient(req.user), user: stripPatient(req.user), userType: 'patient' });
}

export async function syncPatient(req, res) {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patient accounts can update this profile' });
    }

    const { fullName, contactNumber, profileImage } = req.body;
    const patientId = req.user._id;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    await ensureDbConnected();
    const patient = await Patient.findByIdAndUpdate(patientId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({
      success: true,
      patient: stripPatient(patient),
      user: stripPatient(patient),
      userType: 'patient',
    });
  } catch (error) {
    console.error('Sync patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync patient data' });
  }
}
