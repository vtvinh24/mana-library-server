// Data errors
const USER_NOT_FOUND = "User not found";
const userNotFoundError = new Error(USER_NOT_FOUND);

const TAG_NOT_GENERATED = "Tag not generated";
const TagNotGeneratedError = new Error(TAG_NOT_GENERATED);

const EMAIL_INVALID = "Invalid email";
const EmailInvalidError = new Error(EMAIL_INVALID);

// Auth errors
const OTP_SECRET_ERROR = "Missing or invalid OTP secret";
const OtpSecretError = new Error(OTP_SECRET_ERROR);

// Socket errors
const SOCKET_NOT_INITIALIZED = "Socket.io server not initialized";
const SOCKET_AUTH_ERROR = "Socket authentication error";
const socketAuthError = new Error(SOCKET_AUTH_ERROR);

module.exports = {
  USER_NOT_FOUND,
  userNotFoundError,
  OtpSecretError,
  OTP_SECRET_ERROR,
  SOCKET_NOT_INITIALIZED,
  SOCKET_AUTH_ERROR,
  socketAuthError,
  TAG_NOT_GENERATED,
  TagNotGeneratedError,
  EMAIL_INVALID,
  EmailInvalidError,
};
