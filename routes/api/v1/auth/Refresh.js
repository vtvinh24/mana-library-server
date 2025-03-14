const Env = require("#config/Env.js");
const User = require("#models/User.js");
const { createToken, verifyToken } = require("#common/JWT.js");
const { log } = require("#common/Logger.js");

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }
  try {
    const decoded = verifyToken(refreshToken, Env.JWT_REFRESH_SECRET);
    if (!decoded) {
      log("Invalid refresh token", "WARN", "AUTH");
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      log(`User not found for token ID: ${decoded.id}`, "WARN", "AUTH");
      return res.status(401).json({ message: "User not found" });
    }
    const token = createToken(user._id, Env.JWT_EXPIRES_IN);
    return res.status(200).json({
      token,
    });
  } catch (err) {
    log(`Token refresh error: ${err.message}`, "ERROR", "routes POST /auth/refresh");
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};

module.exports = { refresh };
