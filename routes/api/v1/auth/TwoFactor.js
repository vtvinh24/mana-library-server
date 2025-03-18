const { log } = require("#common/Logger.js");
const { generateTOTP, verifyTOTP } = require("#common/OTPAuth.js");
const { OtpSecretError } = require("#enum/Error.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");
const User = require("#models/User.js");
const AuditLogger = require("#services/AuditLogger.js");

const generate2FA = async (req, res) => {
  const { userId } = req;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate TOTP setup
    const buffer = await generateTOTP(user);

    // Convert the QR code buffer to base64 for embedding in JSON
    const qrCodeBase64 = `data:image/png;base64,${buffer.toString("base64")}`;

    // Return both the QR code and the secret in a JSON response
    return res.status(200).json({
      message: "2FA setup generated successfully",
      qrCode: qrCodeBase64,
    });
  } catch (err) {
    log(err, "ERROR", "routes GET /auth/2fa/generate");
    return res.status(500).json({ message: "Failed to generate 2FA setup" });
  }
};

const toggle2FA = async (req, res) => {
  const { userId } = req;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const valid = await verifyTOTP(user, code);
    if (valid) {
      const current = user.auth.twoFactor.enabled;
      const newVal = !current;
      user.auth.twoFactor.enabled = newVal;
      await user.save();
      return res.status(200).json({
        message: `Two-factor authentication has been ${newVal ? "enabled" : "disabled"} successfully`,
        enabled: newVal,
      });
    }
    return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.status });
  } catch (err) {
    if (err === OtpSecretError) {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_DISABLED.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_DISABLED.status });
    }
    log(err, "ERROR", "routes POST /auth/2fa/toggle");
    return res.status(500).json({ message: "An error occurred while processing your request" });
  }
};

const verify2FA = async (req, res) => {
  const { userId } = req;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const enabled = user.auth.twoFactor.enabled;
    if (enabled) {
      const valid = await verifyTOTP(user, code);
      if (valid) return res.status(200).json({ message: "Two-factor authentication verified successfully" });
      else return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.status });
    } else {
      return res.status(403).json({ message: "Two-factor authentication is not enabled for this account" });
    }
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/2fa/verify");
    return res.status(500).json({ message: "An error occurred while verifying two-factor authentication" });
  }
};

module.exports = {
  toggle2FA,
  verify2FA,
  generate2FA,
};
