const crypto = require("crypto");
const User = require("#models/User.js");
const { getHash, generateSalt } = require("#common/Hasher.js");
const { passwordResetLimiter } = require("#middlewares/RateLimit.js");
const { sendMail } = require("#common/Mailer.js");
const Env = require("#config/Env.js");
const { log } = require("#common/Logger.js");

/**
 * Request a password reset (send email with reset link)
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with status message
 */
const requestReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Get client IP for audit logging
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Find user by email (case-insensitive search)
    const user = await User.findOne({
      "auth.email": { $regex: new RegExp(`^${email.toLowerCase()}$`, "i") },
    });

    // Process reset for existing users
    // We still return the same message regardless to prevent email enumeration
    if (user) {
      // Generate a secure random token (32 bytes = 64 hex characters)
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash the token for secure storage
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Set expiration (1 hour)
      const resetTokenExpiry = Date.now() + 3600000;

      // Store hashed token and expiration in user document
      await User.findByIdAndUpdate(user._id, {
        "auth.resetPasswordToken": resetTokenHash,
        "auth.resetPasswordExpires": resetTokenExpiry,
      });

      // Generate reset URL for the email
      const resetUrl = `${Env.CLIENT_APP_URL}/reset-password/${resetToken}`;

      // Create email content
      const subject = "Reset Your ManaLibrary Password";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for your ManaLibrary account.</p>
          <p>Please click the link below to reset your password. This link is valid for 1 hour.</p>
          <p>
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
              Reset Password
            </a>
          </p>
          <p>If you did not request this password reset, you can safely ignore this email.</p>
          <p>Thank you,<br>ManaLibrary Team</p>
        </div>
      `;

      // Send email with reset link
      await sendMail(user.auth.email, subject, html);

      // Audit log the reset request
      log(`Password reset requested for user ${user._id} from IP ${clientIp}`, "INFO", "AUTH");
    } else {
      // Log attempted reset for non-existent email
      log(`Password reset attempted for non-existent email: ${email} from IP ${clientIp}`, "WARN", "AUTH");
    }

    // Always return the same response to prevent email enumeration
    return res.status(200).json({
      message: "If that email exists in our system, we have sent password reset instructions",
    });
  } catch (error) {
    log(`Password reset request error: ${error.message}`, "ERROR", "AUTH");

    // Return generic message to prevent information leakage
    return res.status(500).json({
      message: "Something went wrong processing your request",
    });
  }
};

/**
 * Reset password using token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} Response with status message
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate required fields
    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Get client IP for audit logging
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Hash the token from the request to compare with stored hash
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      "auth.resetPasswordToken": resetTokenHash,
      "auth.resetPasswordExpires": { $gt: Date.now() },
    });

    // Handle invalid or expired token
    if (!user) {
      log(`Invalid/expired reset token attempt from IP ${clientIp}`, "WARN", "AUTH");
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    // Generate a new salt
    const salt = await generateSalt();

    // Hash the new password using Hasher.js
    const hash = await getHash(password, salt);

    // Update user password and clear reset token data
    await User.findByIdAndUpdate(user._id, {
      "auth.hash": hash,
      "auth.salt": salt,
      "auth.resetPasswordToken": null,
      "auth.resetPasswordExpires": null,
      "auth.lastPasswordChange": Date.now(),
      // Reset failed login attempts if any
      "failedLoginAttempts": 0,
    });

    // Send confirmation email
    try {
      const subject = "Password Reset Successful - ManaLibrary";
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful</h2>
          <p>Hello,</p>
          <p>Your password for ManaLibrary has been successfully reset.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Thank you,<br>ManaLibrary Team</p>
        </div>
      `;
      await sendMail(user.auth.email, subject, html);
    } catch (emailError) {
      // Log but don't interrupt the flow
      log(`Failed to send password reset confirmation: ${emailError.message}`, "ERROR", "AUTH");
    }

    // Audit log the successful password reset
    log(`Password reset completed for user ${user._id} from IP ${clientIp}`, "INFO", "AUTH");

    return res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    log(`Password reset error: ${error.message}`, "ERROR", "AUTH");
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

module.exports = { resetPassword, requestReset };
