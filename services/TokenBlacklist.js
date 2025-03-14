const { log } = require("#common/Logger.js");

/**
 * Simple in-memory token blacklist manager
 * Note: Blacklisted tokens will be forgotten on server restart
 */
class TokenBlacklist {
  constructor() {
    // Store blacklisted token IDs with expiration timestamps
    this.blacklistedTokens = new Map();

    // Set up periodic cleanup to prevent memory leaks
    this.setupCleanupTask();

    log("In-memory token blacklist initialized", "INFO", "SECURITY");
  }

  /**
   * Set up periodic cleanup of expired blacklisted tokens
   */
  setupCleanupTask() {
    // Run cleanup every 15 minutes
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 15 * 60 * 1000);
  }

  /**
   * Remove expired tokens from blacklist
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let removedCount = 0;

    for (const [jti, expiry] of this.blacklistedTokens.entries()) {
      if (expiry <= now) {
        this.blacklistedTokens.delete(jti);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      log(`Cleaned up ${removedCount} expired tokens`, "DEBUG", "SECURITY");
    }
  }

  /**
   * Add a token to the blacklist
   * @param {string} jti - Token ID to blacklist
   * @param {number} expirySeconds - Seconds until the token expires
   */
  addToBlacklist(jti, expirySeconds) {
    if (!jti) return false;

    // Calculate expiration timestamp
    const expiryTime = Date.now() + expirySeconds * 1000;

    // Add to blacklist
    this.blacklistedTokens.set(jti, expiryTime);
    log(`Token blacklisted: ${jti}`, "DEBUG", "SECURITY");

    return true;
  }

  /**
   * Check if a token is blacklisted
   * @param {string} jti - Token ID to check
   * @returns {boolean} True if blacklisted
   */
  isBlacklisted(jti) {
    if (!jti) return false;

    return this.blacklistedTokens.has(jti);
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist();

module.exports = tokenBlacklist;
