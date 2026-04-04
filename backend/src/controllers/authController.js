import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import StaffAccount from '../models/StaffAccount.js';
import StaffProfile from '../models/StaffProfile.js';
import { ensureDbConnected } from '../../config/db.js';
import { deletePatientCascade } from '../utils/patientDeletion.js';

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
  // normalize name / profile keys for frontend convenience
  if (!o.name && o.fullName) o.name = o.fullName;
  if (!o.profilePic && o.profileImage) o.profilePic = o.profileImage;
  return o;
}

function mergeStaff(staffDoc, profileDoc) {
  const base = staffDoc.toObject ? staffDoc.toObject() : { ...staffDoc };
  delete base.passwordHash;
  const profile = profileDoc || {};
  // overlay profile fields
  const merged = {
    ...base,
    fullName: profile.fullName || base.fullName,
    staffId: profile.staffId || base.staffId,
    contactNumber: profile.contactNumber || base.contactNumber || '',
    profileImage: profile.profileImage || base.profileImage || '',
    dateOfBirth: profile.dateOfBirth || base.dateOfBirth || undefined,
  };
  // convenience keys for frontend
  if (!merged.name && merged.fullName) merged.name = merged.fullName;
  if (!merged.profilePic && merged.profileImage) merged.profilePic = merged.profileImage;
  merged.userType = 'staff';
  return merged;
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

      // Mark staff session as active at login time.
      const now = new Date();
      staff.lastLoginAt = now;
      staff.lastSeenAt = now;
      await staff.save();

      const token = signToken(staff._id, 'staff');
      // include merged profile data if available so frontend receives up-to-date profile
      const profile = await StaffProfile.findOne({ staff: staff._id });
      const user = mergeStaff(staff, profile);
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
    const merged = mergeStaff(req.user, req.staffProfile);
    return res.json({ success: true, patient: merged, user: merged, userType: 'staff' });
  }
  return res.json({ success: true, patient: stripPatient(req.user), user: stripPatient(req.user), userType: 'patient' });
}

export async function deletePatientAccount(req, res) {
  if (req.userType !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Only patient accounts can be removed this way',
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const p = await Patient.findById(req.user._id).session(session);
    if (!p) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const userOr = [];
    if (p.nic) userOr.push({ nicNumber: String(p.nic).trim() });
    if (p.email) userOr.push({ email: String(p.email).trim().toLowerCase() });

    await deletePatientCascade(p._id, session);

    if (userOr.length > 0) {
      await User.deleteMany({ $or: userOr }, { session });
    }

    await session.commitTransaction();
    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (e) {
    await session.abortTransaction();
    console.error('deletePatientAccount:', e);
    return res.status(500).json({
      success: false,
      message: e.message || 'Failed to delete account',
    });
  } finally {
    session.endSession();
  }
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

export async function syncStaff(req, res) {
  try {
    if (req.userType !== 'staff') {
      return res.status(403).json({ success: false, message: 'Only staff accounts can update this profile' });
    }

    const { fullName, email, contactNumber, profileImage, dateOfBirth, staffId } = req.body;
    const id = req.user._id;

    // split fields between account and profile
    const accountUpdate = {};
    const profileUpdate = {};
    if (email !== undefined) accountUpdate.email = String(email).trim().toLowerCase();
    if (fullName !== undefined) profileUpdate.fullName = fullName;
    if (contactNumber !== undefined) profileUpdate.contactNumber = contactNumber;
    if (profileImage !== undefined) profileUpdate.profileImage = profileImage;
    if (dateOfBirth !== undefined) profileUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (staffId !== undefined) profileUpdate.staffId = staffId;

    await ensureDbConnected();
    // update account (email) and upsert profile
    const staff = Object.keys(accountUpdate).length
      ? await StaffAccount.findByIdAndUpdate(id, accountUpdate, { new: true, runValidators: true })
      : await StaffAccount.findById(id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    const profile = await StaffProfile.findOneAndUpdate(
      { staff: staff._id },
      { $set: profileUpdate },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const merged = mergeStaff(staff, profile);
    res.json({ success: true, staff: merged, user: merged, userType: 'staff' });
  } catch (error) {
    console.error('Sync staff error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: 'Failed to sync staff data' });
  }
}
