import User from "../models/User.js";
import Patient from "../models/Patient.js";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";

dotenv.config();


export const forgotPassword = async (req, res) => {
  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const { email } = req.body;
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail) {
            return res.status(400).json({
                status: 400,
                message: "Email is required"
            });
        }

      const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        const otp = generateOtp();
        const otpHash = await bcryptjs.hash(otp, parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"));

        const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || "10");
        user.passwordResetOtp = otpHash;
        user.passwordResetOtpExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
        user.passwordResetOtpAttempts = 0;
        await user.save();

        await sendEmail({
          to: normalizedEmail,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. It will expire in ${expiresMinutes} minutes.`,
            html: `
                    <div style="font-family: Arial, sans-serif;">
                    <h2>Password Reset OTP</h2>
                    <p>Your OTP is:</p>
                    <h1 style="letter-spacing: 4px;">${otp}</h1>
                    <p>This OTP expires in <b>${expiresMinutes} minutes</b>.</p>
                    </div>
                `,
        });

        return res.status(200).json({
            message: "If the email exists, OTP was sent"
        });

    } catch (error) {
        console.error(error, 'error');
        return res.status(500).json({
            status: 500,
            message: error.message || "Internal server error"
        });
    }
};

export const verifyOtp = async (req, res) => {
  try {
    const data = req.body;

    if (data.email && data.otp) {
      const normalizedEmail = String(data.email || "").trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (!existingUser) {
        return res.status(404).send({
          status: 404,
          message: "User not found",
        });
      }

      if (!existingUser.passwordResetOtp || !existingUser.passwordResetOtpExpires) {
        return res.status(400).send({
          status: 400,
          message: "OTP not found. Please request OTP again.",
        });
      }

      if (existingUser.passwordResetOtpExpires < new Date()) {
        return res.status(400).send({
          status: 400,
          message: "OTP expired. Please request a new OTP.",
        });
      }

      const validOtp = await bcryptjs.compare(data.otp, existingUser.passwordResetOtp);

      if (!validOtp) {
        return res.status(400).send({
          status: 400,
          message: "Invalid OTP.",
        });
      }

      return res.status(200).send({
        status: 200,
        message: "OTP verified successfully. Now you can enter new password.",
      });
    } else {
      return res.status(400).send({
        status: 400,
        message: "Please provide email and otp.",
      });
    }
  } catch (error) {
    console.error(error, "error");
    return res.status(500).send({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const data = req.body;

    if (
        data.email &&
        data.otp && 
        data.newPassword
    ) {
      const normalizedEmail = String(data.email || "").trim().toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (!existingUser) {
        return res.status(404).send({
          status: 404,
          message: "User not found",
        });
      }

      if (!existingUser.passwordResetOtp || !existingUser.passwordResetOtpExpires) {
        return res.status(400).send({
          status: 400,
          message: "OTP not found. Please request OTP again.",
        });
      }

      if (existingUser.passwordResetOtpExpires < new Date()) {
        return res.status(400).send({
          status: 400,
          message: "OTP expired. Please request a new OTP.",
        });
      }

      const validOtp = await bcryptjs.compare(data.otp, existingUser.passwordResetOtp);

      if (!validOtp) {
        return res.status(400).send({
          status: 400,
          message: "Invalid OTP.",
        });
      }

      // Set the new plain password; User pre-save hook will hash it
      existingUser.password = data.newPassword;
      existingUser.passwordResetOtp = undefined;
      existingUser.passwordResetOtpExpires = undefined;
      existingUser.passwordResetOtpAttempts = 0;

      await existingUser.save();

      // Keep the Patient login password in sync (if a matching patient exists)
      try {
        await Patient.findOneAndUpdate(
          { email: normalizedEmail },
          { passwordHash: existingUser.password }
        );
      } catch (syncError) {
        console.error("Error syncing Patient password after reset:", syncError);
      }

      return res.status(200).send({
        status: 200,
        message: "Password updated successfully.",
      });
    } else {
      return res.status(400).send({
        status: 400,
        message: "Please provide email, otp and newPassword.",
      });
    }
  } catch (error) {
    console.error(error, "error");
    return res.status(500).send({
      status: 500,
      message: error.message || "Internal server error",
    });
  }
};