const { log } = require("#common/Logger.js");
const { sendVerificationSms, sendMail } = require("#common/Mailer.js");
const Code = require("#models/Code.js");
const User = require("#models/User.js");
const { generateNumericCode } = require("#models/utils/CodeUtils.js");
const Env = require("#config/Env.js");
const expiresIn = Env.OTP_EXPIRES_IN;
const length = Env.OTP_LENGTH;

const verify = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId } = req;
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const codeDoc = await Code.findOne({ target: user.auth.email || user.auth.phone });
    if (!codeDoc) {
      return res.status(404).json({ message: "Verification code not found or expired" });
    }

    if (codeDoc.code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (codeDoc.used) {
      return res.status(400).json({ message: "Verification code has already been used" });
    }

    await Code.deleteOne({ _id: codeDoc._id });
    await User.updateOne(
      { _id: userId },
      {
        auth: {
          ...user.auth,
          verified: true,
        },
      }
    );

    return res.status(200).json({ message: "Account verified successfully" });
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/verify");
    return res.status(500).json({ message: "An error occurred during verification" });
  }
};

const sendCode = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const otp = generateNumericCode(length);
    const expiry = new Date(Date.now() + expiresIn * 1000);
    await Code.create({ target: email || phone, code: otp, expiry });

    if (email) {
      const htmlTemplate = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; }
              .code { font-size: 24px; font-weight: bold; text-align: center; padding: 10px; background-color: #f5f5f5; margin: 20px 0; letter-spacing: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ManaLibrary Account Verification</h1>
              </div>
              <p>Thank you for registering with ManaLibrary. Please use the verification code below to complete your account setup:</p>
              <div class="code">${otp}</div>
              <p>This code will expire in ${Math.floor(expiresIn / 60)} minutes.</p>
              <p>If you did not request this verification, please ignore this email.</p>
            </div>
          </body>
        </html>
      `;
      await sendMail(email, "ManaLibrary Account Verification", htmlTemplate.replace("{{verificationCode}}", otp));
      return res.status(200).json({ message: "Verification code sent to email" });
    }

    if (phone) {
      await sendVerificationSms(phone, otp);
      return res.status(200).json({ message: "Verification code sent to phone" });
    }
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/send-code");
    return res.status(500).json({ message: "An error occurred while sending verification code" });
  }
};

module.exports = {
  verify,
  sendCode,
};
