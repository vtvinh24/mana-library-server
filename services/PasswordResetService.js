const crypto = require("crypto");
const User = require("#models/User.js");
const EmailService = require("#services/EmailService.js");
const bcrypt = require("bcryptjs");
const Env = require("#config/Env.js");

class PasswordResetService {
  /**
   * Request a password reset for a user
   * @param {string} email - User's email
   * @returns {Promise<boolean>} Always returns true to prevent email enumeration
   */
  static async requestReset(email) {
    try {
      // Find user by email (case-insensitive)
      const user = await User.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase()}$`, "i") },
      });

      // Exit silently if no user found (prevents email enumeration)
      if (!user) {
        return true;
      }

      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Store only the hash of the token in the database
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Set token expiration (1 hour)
      const resetTokenExpiry = Date.now() + 3600000;

      // Update user with reset token info
      await User.findByIdAndUpdate(user._id, {
        "auth.resetPasswordToken": resetTokenHash,
        "auth.resetPasswordExpires": resetTokenExpiry,
      });

      // Create reset URL with the unhashed token
      const resetUrl = `${Env.CLIENT_APP_URL}/reset-password/${resetToken}`;

      // Send email with reset instructions
      await EmailService.sendPasswordResetEmail(user.email, resetUrl);

      return true;
    } catch (error) {
      console.error("Password reset request error:", error);
      return true; // Always return true to prevent email enumeration
    }
  }

  /**
   * Reset a user's password with a valid token
   * @param {string} token - Unhashed reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If token is invalid/expired or password doesn't meet requirements
   */
  static async resetPassword(token, newPassword) {
    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      "auth.resetPasswordToken": resetTokenHash,
      "auth.resetPasswordExpires": { $gt: Date.now() },
    });

    // Handle invalid token
    if (!user) {
      const error = new Error("Password reset token is invalid or has expired");
      error.statusCode = 400;
      throw error;
    }

    // Validate password strength (example: minimum 8 characters)
    if (!newPassword || newPassword.length < 8) {
      const error = new Error("Password must be at least 8 characters long");
      error.statusCode = 400;
      throw error;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user with new password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      "auth.password": hashedPassword,
      "auth.resetPasswordToken": null,
      "auth.resetPasswordExpires": null,
      "auth.lastPasswordChange": Date.now(),
    });

    return true;
  }
}

module.exports = PasswordResetService;
