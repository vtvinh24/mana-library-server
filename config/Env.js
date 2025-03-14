/**
 * Environment variables with defaults
 */
const Env = {
  // Boot params
  "RUNNING_MODE": process.env.RUNNING_MODE || "standalone",
  "NODE_ENV": process.env.NODE_ENV || "development",
  "PORT": process.env.PORT || 3000,

  // Directories
  "DIR_LOGS": process.env.DIR_LOGS || "./logs",
  "DIR_MEDIA": process.env.DIR_MEDIA || "./media",

  // Database credentials
  "DB_HOST": process.env.DB_HOST || "localhost",
  "DB_PORT": process.env.DB_PORT || 27017,
  "DB_USER": process.env.DB_USER || "",
  "DB_PASSWORD": process.env.DB_PASSWORD || "",
  "DB_DATABASE": process.env.DB_DATABASE || "",

  // Logger
  "LOGGER_LEVEL": process.env.LOGGER_LEVEL || "INFO",

  // CORS
  "CORS_ORIGIN": process.env.CORS_ORIGIN || "*",

  // Rate-limiter
  "RATE_LIMITER_WINDOW_MS": process.env.RATE_LIMITER_WINDOW_MS || 15000,
  "RATE_LIMITER_MAX": process.env.RATE_LIMITER_MAX || 100,

  // Username
  "USERNAME_GENERATOR": process.env.USERNAME_GENERATOR || "EMAIL",

  // Tag configuration
  "TAG_TYPE": process.env.TAG_TYPE || "NUMERIC",
  "TAG_LENGTH": process.env.TAG_LENGTH || 6,
  "TAG_MAX_RANGE": process.env.TAG_MAX_RANGE || 1000000,
  "TAG_GENERATOR": process.env.TAG_GENERATOR || "SEQUENTIAL",

  // JWT
  "JWT_ALGORITHM": process.env.JWT_ALGORITHM || "RS256",
  "JWT_SECRET":
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET must be set in production");
        })()
      : "dev_only_secret_do_not_use_in_production"),
  "JWT_EXPIRES_IN": process.env.JWT_EXPIRES_IN || "1h",
  "JWT_ISSUER": process.env.JWT_ISSUER || "issuer",
  "JWT_REFRESH_EXPIRES_IN": process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // OTP
  "OTP_LENGTH": process.env.OTP_LENGTH || 6,
  "OTP_EXPIRES_IN": process.env.OTP_EXPIRES_IN || "1d",

  // 2FA
  "2FA_METHOD": process.env["2FA_METHOD"] || "TOTP",
  "TOTP_PERIOD": process.env.TOTP_PERIOD || 30,
  "TOTP_ISSUER": process.env.TOTP_ISSUER || "wordle",
  "TOTP_LABEL": process.env.TOTP_LABEL || "wordle",
  "TOTP_ALGORITHM": process.env.TOTP_ALGORITHM || "SHA1",
  "TOTP_DIGITS": process.env.TOTP_DIGITS || 6,
  "TOTP_SECRET": process.env.TOTP_SECRET || "",

  // Mailer general config
  "MAILER_FROM_EMAIL": process.env.MAILER_FROM_EMAIL || "",
  "MAILER_FROM_NAME": process.env.MAILER_FROM_NAME || "",
  "MAILER_REPLY_TO": process.env.MAILER_REPLY_TO || "",

  // Nodemailer config
  "SMTP_HOST": process.env.SMTP_HOST || "",
  "SMTP_PORT": process.env.SMTP_PORT || 587,
  "SMTP_SECURE": process.env.SMTP_SECURE || false,
  "SMTP_USER": process.env.SMTP_USER || "",
  "SMTP_PASS": process.env.SMTP_PASS || "",
};

module.exports = Env;
