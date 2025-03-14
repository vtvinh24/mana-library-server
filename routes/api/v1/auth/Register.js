const { log } = require("#common/Logger.js");
const User = require("#models/User.js");
const { getHash, generateSalt } = require("#common/Hasher.js");
const { createToken } = require("#common/JWT.js");
const { filteredUser, generateIdentifier } = require("#models/utils/UserUtils.js");
const { isEmail } = require("#common/Validator.js");
const { getComplexity } = require("#common/Password.js");
const { TagNotGeneratedError } = require("#enum/Error.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");
const Env = require("#config/Env.js");
const { sendMail } = require("#common/Mailer.js");

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const user = await User.findOne({ "auth.email": email });
    if (user) {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.message });
    }

    const complexity = getComplexity(password);
    if (complexity < 3) {
      return res.status(400).json({ message: "Password is too weak" });
    }

    const salt = await generateSalt();
    const hash = await getHash(password, salt);

    let finalUsername = null;
    try {
      finalUsername = await generateIdentifier(email);
    } catch (err) {
      if (err === TagNotGeneratedError) {
        return res.status(CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN).json({ message: CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.message });
      }
    }

    const newUser = new User({
      identifier: {
        username: finalUsername.username,
        tag: finalUsername.tag,
      },
      auth: {
        email,
        hash,
        salt,
      },
    });
    await newUser.save();

    const filtered = filteredUser(newUser);
    const token = createToken(user._id, Env.JWT_EXPIRES_IN);
    const refreshToken = createToken(user._id, Env.JWT_REFRESH_EXPIRES_IN);
    if (email) {
      try {
        const subject = "Welcome to ManaLibrary";
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to ManaLibrary!</h2>
            <p>Hello ${finalUsername.username},</p>
            <p>Thank you for registering with ManaLibrary. Your account has been created successfully.</p>
            <p>To get started, you can browse our collection, borrow books, and manage your account.</p>
            <p>Thank you,<br>ManaLibrary Team</p>
          </div>
        `;
        await sendMail(email, subject, html);
      } catch (emailError) {
        // Log but don't interrupt registration
        log(`Failed to send welcome email: ${emailError.message}`, "ERROR", "AUTH");
      }
    }
    newUser.lastLogin = new Date();
    await newUser.save();
    return res.status(201).json({
      token,
      refreshToken,
      user: filtered,
    });
  } catch (err) {
    log(err, "ERROR", "routes POST /auth/register");
    return res.status(500).send();
  }
};

module.exports = { register };
