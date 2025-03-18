const { verifyToken, createToken } = require("#common/JWT.js");
const User = require("#models/User.js");
const { CUSTOM_HTTP_STATUS } = require("#enum/HttpStatus.js");
const Env = require("#config/Env.js");
const tokenBlacklist = require("#services/TokenBlacklist.js");
const { log } = require("#common/Logger.js");

/**
 * This middleware checks if the user has a valid JWT token
 */
const JwtMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  req.authenticated = false;

  if (!token) {
    return next();
  }

  try {
    // Verify token and extract payload
    const decoded = verifyToken(token);

    // Check if token has been blacklisted
    if (decoded.jti && tokenBlacklist.isBlacklisted(decoded.jti)) {
      return res.status(401).json({ message: "Unauthorized: token has been revoked" });
    }

    // Add safety check for token payload
    if (!decoded || !decoded.payload) {
      return res.status(401).json({ message: "Unauthorized: invalid token structure" });
    }

    // Check token issue time to prevent replay attacks with very old tokens
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = 7 * 24 * 60 * 60; // 7 days in seconds
    if (tokenAge > maxTokenAge) {
      return res.status(401).json({ message: "Unauthorized: token too old" });
    }

    // Look up user with a lean query for better performance
    const user = await User.findById(decoded.payload).lean();

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (user.auth.banned) {
      return res.status(403).json({ message: "Forbidden: account is suspended" });
    }

    // Store token in request for potential later revocation
    req.token = token;
    req.tokenJti = decoded.jti;
    req.userId = user._id;
    req.role = user.auth.role;
    req.authenticated = true;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(CUSTOM_HTTP_STATUS.AUTH_TOKEN_EXPIRED.code).json({
        message: CUSTOM_HTTP_STATUS.AUTH_TOKEN_EXPIRED.status,
      });
    }

    log("JWT verification error: " + error.message, "WARN", "SECURITY");
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

/**
 * Middleware to ensure a user is authenticated
 * Use this to protect routes that require authentication
 */
const requireAuth = (req, res, next) => {
  if (!req.authenticated) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

/**
 * Middleware factory to restrict access based on user roles
 * @param {string|string[]} allowedRoles - Single role or array of roles that can access the route
 * @returns {Function} Express middleware
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    // First ensure user is authenticated
    if (!req.authenticated) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Convert single role to array for consistent handling
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // If user has admin role, always allow access
    // This is a common pattern to let admins access everything
    if (req.role === "admin") {
      return next();
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.role)) {
      log(`Access denied: User ${req.userId} with role ${req.role} attempted to access resource requiring ${roles.join(", ")}`, "WARN", "SECURITY");

      return res.status(403).json({
        message: "Forbidden: You don't have permission to access this resource",
      });
    }

    next();
  };
};

/**
 * Logout function that revokes current token
 */
const logout = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.authenticated || !req.tokenJti) {
      return res.status(200).json({ message: "Already logged out" });
    }

    // Get token expiration from payload
    const decoded = verifyToken(req.token);
    const expirySeconds = decoded.exp - Math.floor(Date.now() / 1000);

    // Add token to blacklist
    tokenBlacklist.addToBlacklist(req.tokenJti, expirySeconds);

    log(`User ${req.userId} logged out`, "INFO", "AUTH");
    res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    log("Logout error: " + error.message, "ERROR", "SECURITY");
    res.status(500).json({ message: "Failed to process logout" });
  }
};

/**
 * Middleware for token refresh
 * Issues a new access token if a valid refresh token is provided
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token
    const decoded = verifyToken(refreshToken);

    // Check if refresh token has been blacklisted
    if (decoded.jti && tokenBlacklist.isBlacklisted(decoded.jti)) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Add safety check for token payload
    if (!decoded || !decoded.payload) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // Look up user
    const user = await User.findById(decoded.payload).lean();

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user account is active
    if (user.auth.banned) {
      return res.status(403).json({ message: "Account is suspended" });
    }

    // Generate new access token
    const newToken = createToken(user._id, Env.JWT_EXPIRES_IN);

    log(`Token refreshed for user ${user._id}`, "INFO", "AUTH");

    return res.json({
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.auth.role,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    log("Token refresh error: " + error.message, "WARN", "SECURITY");
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// Export your other functions too
module.exports = {
  JwtMiddleware,
  logout,
  requireAuth,
  requireRoles,
  refreshToken,
};
