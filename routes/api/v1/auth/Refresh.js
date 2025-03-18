const Env = require("#config/Env.js");
const User = require("#models/User.js");
const { createToken, verifyToken } = require("#common/JWT.js");
const { log } = require("#common/Logger.js");
const tokenBlacklist = require("#services/TokenBlacklist.js");

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }
  try {
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      log("Invalid refresh token", "WARN", "AUTH");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(decoded.jti)) {
      log(`Attempt to use blacklisted token: ${decoded.jti}`, "WARN", "SECURITY");
      return res.status(401).json({ message: "Token has been revoked" });
    }

    const user = await User.findById(decoded.payload);
    if (!user) {
      log(`User not found for token ID: ${decoded.id}`, "WARN", "AUTH");
      return res.status(401).json({ message: "User not found" });
    }

    // Blacklist the used refresh token to prevent reuse
    const tokenExpiry = Math.floor(decoded.exp - Date.now() / 1000);
    tokenBlacklist.addToBlacklist(decoded.jti, tokenExpiry > 0 ? tokenExpiry : 0);

    // Create new access token
    const accessToken = createToken(user._id, Env.JWT_EXPIRES_IN);

    // Create new refresh token (token rotation)
    const newRefreshToken = createToken(user._id, Env.REFRESH_TOKEN_EXPIRES_IN);

    return res.status(200).json({
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    log(`Token refresh error: ${err.message}`, "ERROR", "routes POST /auth/refresh");
    return res.status(500).json({ message: "Failed to refresh token" });
  }
};

module.exports = { refresh };
