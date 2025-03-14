const { log } = require("#common/Logger.js");

/**
 * Simple security audit logging that uses the existing logger
 */
const AuditLogger = {
  /**
   * Log a security event
   *
   * @param {string} event - Event type
   * @param {string} level - Log level ('INFO', 'WARN', 'ALERT')
   * @param {object} data - Additional event data
   * @param {string} userId - User ID or 'anonymous'
   * @param {string} ip - IP address
   */
  logEvent: (event, level, data = {}, userId = "anonymous", ip = "unknown") => {
    // Sanitize sensitive data
    const sanitizedData = { ...data };
    const sensitiveFields = ["password", "token", "secret"];

    Object.keys(sanitizedData).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitizedData[key] = "[REDACTED]";
      }
    });

    // Create message
    const logMessage = `SECURITY: ${event} - User: ${userId} - IP: ${ip}`;

    // Map audit level to log level
    let logLevel;
    switch (level) {
      case "ALERT":
        logLevel = "ERROR";
        break;
      case "WARN":
        logLevel = "WARN";
        break;
      default:
        logLevel = "INFO";
    }

    // Log the event
    log(logMessage, logLevel, "AUDIT", sanitizedData);
  },

  /**
   * Log authentication events
   */
  auth: {
    loginSuccess: (userId, ip, metadata = {}) => {
      AuditLogger.logEvent("LOGIN_SUCCESS", "INFO", metadata, userId, ip);
    },

    loginFailure: (email, ip, reason = "invalid_credentials") => {
      AuditLogger.logEvent("LOGIN_FAILURE", "WARN", { reason }, email, ip);
    },

    logout: (userId, ip) => {
      AuditLogger.logEvent("LOGOUT", "INFO", {}, userId, ip);
    },

    passwordChanged: (userId, ip, isReset = false) => {
      const event = isReset ? "PASSWORD_RESET" : "PASSWORD_CHANGE";
      AuditLogger.logEvent(event, "INFO", {}, userId, ip);
    },
  },

  /**
   * Log data access events
   */
  data: {
    access: (resource, userId, ip, details = {}) => {
      AuditLogger.logEvent("DATA_ACCESS", "INFO", { resource, ...details }, userId, ip);
    },

    modification: (resource, userId, ip, details = {}) => {
      AuditLogger.logEvent("DATA_MODIFICATION", "INFO", { resource, ...details }, userId, ip);
    },

    deletion: (resource, userId, ip, details = {}) => {
      AuditLogger.logEvent("DATA_DELETION", "WARN", { resource, ...details }, userId, ip);
    },
  },

  /**
   * Log access control events
   */
  access: {
    denied: (resource, userId, ip, reason = "insufficient_permissions") => {
      AuditLogger.logEvent("ACCESS_DENIED", "WARN", { resource, reason }, userId, ip);
    },

    roleChange: (targetUserId, newRole, userId, ip) => {
      AuditLogger.logEvent("ROLE_CHANGE", "ALERT", { targetUserId, newRole }, userId, ip);
    },

    accountLocked: (targetUserId, reason, userId, ip) => {
      AuditLogger.logEvent("ACCOUNT_LOCKED", "ALERT", { targetUserId, reason }, userId, ip);
    },
  },
};

module.exports = AuditLogger;
