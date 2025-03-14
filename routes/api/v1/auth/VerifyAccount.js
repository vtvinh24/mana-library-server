const { log } = require("#common/Logger.js");
const { sendVerificationSms, sendMail } = require("#common/Mailer.js");
const Code = require("#models/Code.js");
const User = require("#models/User.js");
const { generateNumericCode } = require("#models/utils/CodeUtils.js");
const Env = require("#config/Env.js");
const expiresIn = Env.OTP_EXPIRES_IN || 300;
const length = Env.OTP_LENGTH || 6;

const verify = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId } = req;
    if (!code) {
      return res.status(400).send();
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send();
    }

    const codeDoc = await Code.findOne({ target: user.email || user.phone });
    if (!codeDoc) {
      return res.status(404).send();
    }

    if (codeDoc.code !== code) {
      return res.status(400).send();
    }

    if (codeDoc.used) {
      return res.status(400).send();
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

    return res.status(200).send();
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/verify");
    return res.status(500).send();
  }
};

const sendCode = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (!user) {
      return res.status(404).send();
    }

    const otp = generateNumericCode(length);
    const expiry = new Date(Date.now() + expiresIn * 1000);
    await Code.create({ target: email || phone, code: otp, expiry });

    if (!email && !phone) {
      return res.status(400).send();
    }

    if (email) {
      const htmlTemplate = require("config/EmailTemplates/Verification");
      await sendMail(email, "ManaLibrary Account Verification", htmlTemplate.replace("{{verificationCode}}", otp));
      return res.status(200).send();
    }

    if (phone) {
      await sendVerificationSms(phone, otp);
      return res.status(200).send();
    }
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/send-code");
    return res.status(500).send();
  }
};

module.exports = {
  verify,
  sendCode,
};
