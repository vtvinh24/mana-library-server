const User = require("#models/User.js");
const { getHash } = require("#common/Hasher.js");
const { createToken } = require("#common/JWT.js");
const Env = require("#config/Env.js");
const AuditLogger = require("#services/AuditLogger.js");
const { log } = require("#common/Logger.js");
const { verifyTOTP } = require("#common/OTPAuth.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");

/**
 * Handle user login
 */
const login = async (req, res) => {
  try {
    const { email, password, code } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({
      "auth.email": { $regex: new RegExp(`^${email.toLowerCase()}$`, "i") },
    });

    // Get client IP for audit logging
    const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // User not found
    if (!user) {
      // Log failed login
      AuditLogger.auth.loginFailure(email, clientIp, "user_not_found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is active
    if (user.auth && user.auth.banned) {
      // Log failed login due to banned account
      AuditLogger.auth.loginFailure(email, clientIp, "account_banned");
      return res.status(403).json({ message: "Account is suspended" });
    }

    // Verify password using Hasher.js
    // Get user's stored salt
    const salt = user.auth.salt;

    // Hash the provided password using the same salt
    const hashedPassword = await getHash(password, salt);

    // Compare the computed hash with the stored hash
    const isPasswordValid = hashedPassword === user.auth.hash;

    // If password is invalid
    if (!isPasswordValid) {
      await handleFailedLogin(user, email, clientIp, res);
      return;
    }

    // Check if 2FA is enabled and validate code if necessary
    if (user.auth.twoFactor && user.auth.twoFactor.enabled) {
      // If 2FA is enabled but no code provided
      if (!code) {
        return res.status(401).json({
          message: "Two-factor authentication code required",
        });
      }

      // Verify the 2FA code
      const validCode = await verifyTOTP(user, code);
      if (!validCode) {
        AuditLogger.auth.loginFailure(email, clientIp, "invalid_2fa_code");
        return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.code).json({
          message: "Invalid two-factor authentication code",
        });
      }
    }

    // Password is valid (and 2FA if required) - handle successful login

    // Generate tokens
    const token = createToken(user._id, Env.JWT_EXPIRES_IN);
    const refreshToken = createToken(user._id, Env.JWT_REFRESH_EXPIRES_IN);

    // Log successful login
    AuditLogger.auth.loginSuccess(user._id, clientIp, {
      method: "password",
      userAgent: req.headers["user-agent"],
    });

    // Update last login timestamp
    await User.findByIdAndUpdate(user._id, { "auth.lastLogin": Date.now() });

    return res.status(200).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.identifier.username,
        tag: user.identifier.tag,
        email: user.auth.email,
        role: user.auth.role,
        verified: user.auth.verified,
        enable2FA: user.auth.twoFactor?.enabled || false,
      },
    });
  } catch (error) {
    log(`Login error: ${error.message}`, "ERROR", "AUTH");
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Handle failed login attempt
 *
 * @param {Object} user - User document
 * @param {string} email - Email used for login attempt
 * @param {string} clientIp - Client IP address
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function handleFailedLogin(user, email, clientIp, res) {
  // Track failed login attempts
  const failedAttempts = (user.failedLoginAttempts || 0) + 1;
  const updateData = { failedLoginAttempts: failedAttempts };

  // Lock account after too many failed attempts
  if (failedAttempts >= 5) {
    updateData["auth.banned"] = new Date();
    updateData["lockReason"] = "Too many failed login attempts";

    AuditLogger.access.accountLocked(user._id, "max_failed_attempts", "system", clientIp);
  }

  await User.findByIdAndUpdate(user._id, updateData);

  // Log failed login
  AuditLogger.auth.loginFailure(email, clientIp, "invalid_password");

  return res.status(401).json({ message: "Invalid credentials" });
}

module.exports = { login };
