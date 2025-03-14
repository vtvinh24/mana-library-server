const OTPAuth = require("otpauth");
const User = require("#models/User.js");
const { generateBase32 } = require("./Hasher");
const QRCode = require("qrcode");
const { OtpSecretError } = require("#enum/Error.js");
const Env = require("#config/Env.js");

/**
 * Generates a TOTP secret and URL for the specified user.
 * @async
 * @param {string} secret A base32 encoded secret
 * @param {number} [period=30] period The period of time in seconds that a TOTP code will be valid for
 * @returns {Promise<string>} A promise that resolves with the QR url.
 */
async function generateTOTP(user) {
  // validate user object type = user
  if (!(user instanceof User)) {
    throw new Error("Invalid user object");
  }

  let label = user.identifier.username;

  const secret = generateBase32();
  const totp = new OTPAuth.TOTP({
    algorithm: Env.TOTP_ALGORITHM || "SHA1",
    issuer: Env.TOTP_ISSUER,
    label: label || Env.TOTP_LABEL,
    digits: Env.TOTP_DIGITS || 6,
    period: Env.TOTP_PERIOD || 30,
    secret,
  });

  user.auth.otpSecret = secret;
  await user.save();
  return new Promise((resolve, reject) => {
    QRCode.toBuffer(totp.toString(), (err, buffer) => {
      if (err) {
        return reject(err);
      }
      resolve(buffer);
    });
  });
}

/**
 * Verifies the provided TOTP code for the specified user.
 * @async
 * @param {Object} user The user object
 * @param {string} token The TOTP token to verify
 * @param {number} [window=1] The window of time steps to allow for clock drift
 * @returns {Promise<boolean>} A promise that resolves to true if the token is valid, otherwise false.
 */
async function verifyTOTP(user, token, window = 1) {
  // Validate user object
  if (!(user instanceof User)) {
    throw new Error("Invalid user object");
  }
  if (!user.auth || !user.auth.otpSecret) {
    throw OtpSecretError;
  }

  // Create TOTP instance using the user's secret
  const totp = new OTPAuth.TOTP({
    algorithm: Env.TOTP_ALGORITHM || "SHA1",
    issuer: Env.TOTP_ISSUER,
    label: Env.TOTP_LABEL,
    digits: Env.TOTP_DIGITS || 6,
    period: Env.TOTP_PERIOD || 30,
    secret: user.auth.otpSecret,
  });

  // Verify the token
  const isValid = totp.validate({ token, window }) !== null;
  return isValid;
}

module.exports = {
  generateTOTP,
  verifyTOTP,
};
