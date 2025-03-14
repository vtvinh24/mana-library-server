const { log } = require("#common/Logger.js");
const { generateTOTP, verifyTOTP } = require("#common/OTPAuth.js");
const { OtpSecretError } = require("#enum/Error.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");
const User = require("#models/User.js");

const generate2FA = async (req, res) => {
  const { userId } = req;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send();
    }
    const buffer = await generateTOTP(user);

    res.setHeader("Content-Type", "image/png");
    res.status(200).send(buffer);
  } catch (err) {
    log(err, "ERROR", "routes GET /auth/2fa/generate");
    return res.status(500).send();
  }
};

const toggle2FA = async (req, res) => {
  const { userId } = req;
  if (!userId) {
    return res.status(401).send();
  }
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).send();
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send();
    }
    const valid = await verifyTOTP(user, code);
    if (valid) {
      const current = user.auth.enable2FA;
      const newVal = !current;
      user.auth.enable2FA = newVal;
      await user.save();
      return res.status(200).send();
    }
    return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.status });
  } catch (err) {
    if (err === OtpSecretError) {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_DISABLED.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_DISABLED.status });
    }
    log(err, "ERROR", "routes POST /auth/2fa/toggle");
    return res.status(500).send();
  }
};

const verify2FA = async (req, res) => {
  const { userId } = req;

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).send();
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send();
    }
    const enabled = user.auth.enable2FA;
    if (enabled) {
      const valid = await verifyTOTP(user, code);
      if (valid) return res.status(200).send();
      else return res.status(CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_2FA_INVALID.status });
    } else {
      return res.status(403).send();
    }
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/2fa/verify");
    return res.status(500).send();
  }
};

module.exports = {
  toggle2FA,
  verify2FA,
  generate2FA,
};
