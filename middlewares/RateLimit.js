const rateLimit = require("express-rate-limit");
const Env = require("#config/Env.js");

/**
 * Creates a rate limiter middleware with specified options
 *
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per windowMs
 * @param {string} options.message - Response message
 * @returns {Function} Express middleware function
 */
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: options.message },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  });
};

// Specific limiters for different endpoints
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per IP
  message: "Too many login attempts, please try again after 15 minutes",
  skipSuccessfulRequests: true, // Only count failed attempts
});

const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many password reset attempts, please try again after an hour",
});

// General API rate limiter
const apiLimiter = createLimiter({
  windowMs: parseInt(Env.RATE_LIMITER_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(Env.RATE_LIMITER_MAX) || 100,
  message: "Too many requests, please try again later",
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  createLimiter,
};
