/**
 * Environment variables with defaults
 */
const Env = {
  // Boot params
  RUNNING_MODE: process.env.RUNNING_MODE || "standalone",
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  // Directories
  DIR_LOGS: process.env.DIR_LOGS || "./logs",
  DIR_MEDIA: process.env.DIR_MEDIA || "./media",

  // Database credentials
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 27017,
  DB_USER: process.env.DB_USER || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_DATABASE: process.env.DB_DATABASE || "",

  // Database connection retry settings
  DB_RETRY_DELAY: process.env.DB_RETRY_DELAY || 5000,
  DB_RETRY_COUNT: process.env.DB_RETRY_COUNT || 5,

  // Logger
  LOGGER_LEVEL: process.env.LOGGER_LEVEL || "INFO",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Rate-limiter
  RATE_LIMITER_WINDOW_MS: process.env.RATE_LIMITER_WINDOW_MS || 15000,
  RATE_LIMITER_MAX: process.env.RATE_LIMITER_MAX || 100,

  // JWT
  JWT_ALGORITHM: process.env.JWT_ALGORITHM || "RS256",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET must be set in production");
        })()
      : "dev_only_secret_do_not_use_in_production"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_ISSUER: process.env.JWT_ISSUER || "issuer",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

module.exports = Env;
