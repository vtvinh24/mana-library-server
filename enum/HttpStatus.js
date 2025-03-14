const CUSTOM_HTTP_STATUS = Object.freeze({
  // JWT Token
  AUTH_TOKEN_EXPIRED: {
    code: 401,
    message: "token expired",
  },
  AUTH_TOKEN_INVALID: {
    code: 401,
    message: "invalid token",
  },

  // Generic authentication
  AUTH_CREDENTIALS_INVALID: {
    code: 400,
    message: "invalid credentials",
  },
  AUTH_INFO_TAKEN: {
    code: 409,
    message: "username, email or phone taken",
  },
  AUTH_ACCOUNT_LOCKED: {
    code: 403,
    message: "account locked",
  },
  AUTH_PASSWORD_TOO_WEAK: {
    code: 400,
    message: "password too weak",
  },

  // 2FA
  AUTH_REQUIRE_2FA: {
    code: 204,
    message: "two-factor code required",
  },
  AUTH_2FA_INVALID: {
    code: 401,
    message: "invalid two-factor code",
  },
  AUTH_2FA_DISABLED: {
    code: 403,
    message: "two-factor secret not generated",
  },
});

module.exports = { CUSTOM_HTTP_STATUS };
