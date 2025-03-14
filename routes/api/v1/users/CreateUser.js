const User = require("#models/User.js");
const { filteredUser, generateIdentifier } = require("#models/utils/UserUtils.js");
const { log } = require("#common/Logger.js");
const { getHash, generateSalt } = require("#common/Hasher.js");
const { getComplexity } = require("#common/Password.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");

const createUser = async (req, res) => {
  try {
    const { email, password, role, profile, library } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ "auth.email": email.toLowerCase() });
    if (existingUser) {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.message });
    }

    // Check password complexity if provided
    if (password) {
      const complexity = getComplexity(password);
      if (complexity < 3) {
        return res.status(400).json({ message: "Password is too weak" });
      }
    } else {
      return res.status(400).json({ message: "Password is required" });
    }

    // Generate salt and hash for password using Hasher.js functions
    const salt = await generateSalt();
    const hash = await getHash(password, salt);

    // Generate username and tag
    let finalUsername;
    try {
      finalUsername = await generateIdentifier(email);
    } catch (err) {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.code).json({ message: CUSTOM_HTTP_STATUS.AUTH_INFO_TAKEN.message });
    }

    // Create new user with provided info
    const newUser = new User({
      identifier: {
        username: finalUsername.username,
        tag: finalUsername.tag,
      },
      auth: {
        email: email.toLowerCase(),
        hash,
        salt,
        role: role || undefined, // Use the default from schema if not provided
        verified: false,
      },
      profile: profile || {},
      library: library || {},
    });

    await newUser.save();

    const filtered = filteredUser(newUser);
    return res.status(201).json({
      message: "User created successfully",
      user: filtered,
    });
  } catch (err) {
    log(err, "ERROR", "routes POST /users");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createUser };
