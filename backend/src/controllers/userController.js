import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

function stripPassword(userDoc) {
  const obj = userDoc.toObject();
  delete obj.password;
  return obj;
}

export async function registerUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      fullName,
      email,
      phoneNumber,
      nicNumber,
      dob,
      address,
      gender,
      medicalHistory,
      emergencyContact,
      password,
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { nicNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        error:
          existingUser.email === email
            ? 'Email is already registered'
            : 'NIC number is already registered',
      });
}

const user = new User({
      fullName,
      email,
      phoneNumber,
      nicNumber,
      dob,
      address,
      gender,
      medicalHistory: medicalHistory || '',
      emergencyContact: emergencyContact || '',
      password,
    });

    await user.save();

    try {
      await Patient.findOneAndUpdate(
        { nic: nicNumber.trim() },
        {
          fullName,
          nic: nicNumber.trim(),
          dateOfBirth: new Date(dob),
          contactNumber: phoneNumber || '',
          email: email.trim().toLowerCase(),
          passwordHash: user.password,
        },
        { upsert: true, new: true }
      );
    } catch (syncErr) {
      console.error('Patient sync after user registration:', syncErr);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: stripPassword(user),
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message,
    });
  }
}



export async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: stripPassword(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}

export async function getUserByEmail(req, res) {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log('🔍 [getUserByEmail] Looking up User with email:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.warn('⚠️ [getUserByEmail] No User found for email:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ [getUserByEmail] Found User:', {
      name: user.fullName,
      email: user.email,
      id: user._id,
      nic: user.nicNumber
    });
    
    res.json({ success: true, user: stripPassword(user) });
  } catch (error) {
    console.error('❌ [getUserByEmail] Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function updateUserById(req, res) {
  try {
    const errors = validationResult(req);
    // Only fail validation if there are actual errors on non-profileImage fields
    if (!errors.isEmpty()) {
      const hasValidationErrors = errors.array().some(err => err.param !== 'profileImage');
      if (hasValidationErrors) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }
    }

    const {
      fullName,
      email,
      phoneNumber,
      address,
      gender,
      medicalHistory,
      emergencyContact,
      profileImage,
      dob,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
      }
    }

    // Prevent huge base64 payloads by default (roughly 5MB string = ~5000000 chars)
    if (profileImage && profileImage.length > 5_000_000) {
      return res.status(400).json({
        success: false,
        message: 'Profile image is too large. Please upload a smaller image.',
      });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (gender !== undefined) user.gender = gender;
    if (medicalHistory !== undefined) user.medicalHistory = medicalHistory;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (dob !== undefined && dob) user.dob = dob;

    await user.save();

    // Sync profileImage to Patient model if it exists
    if (profileImage !== undefined) {
      try {
        await Patient.findOneAndUpdate(
          { nic: user.nicNumber.trim() },
          { profileImage },
          { new: true }
        );
        console.log('✅ Synced profileImage to Patient model');
      } catch (syncErr) {
        console.warn('⚠️ Failed to sync profileImage to Patient:', syncErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: stripPassword(user),
    });
  } catch (error) {
    console.error('Update error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}

export async function deleteUserById(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}


