/**
 *
 * Server messages
 */
const INTERNAL_SERVER_ERROR = "Internal Server Error";
const SOCKET_NOT_INITIALIZED = "Socket.io server not initialized";
const SOCKET_INITIALIZED = "Socket.io server initialized";
const TAG_NOT_GENERATED = "Tag not generated";
const SOCKET_AUTH_ERROR = "Socket authentication error";
const OTP_SECRET_ERROR = "Missing or invalid OTP secret";

/**
 *
 * Model messages
 */

// Field messages
const EMAIL_INVALID = "Invalid email";

// User messages
const USER_NOT_FOUND = "User not found";

// Book messages
const BOOK_CREATED = "Book created";
const BOOK_UPDATED = "Book updated";
const BOOK_DELETED = "Book deleted";
const BOOK_NOT_FOUND = "Book not found";
const BOOK_NOT_AVAILABLE = "Book not available";
const BOOK_RESERVED = "Book reserved";
const BOOK_BORROWED = "Book borrowed";
const BOOK_RETURNED = "Book returned";
const BOOK_LOST = "Book lost";
const BOOK_ALREADY_BORROWED = "Book already borrowed";
const BOOK_ALREADY_RESERVED = "Book already reserved";
const BOOK_ALREADY_RETURNED = "Book already returned";
const BOOK_ALREADY_AVAILABLE = "Book already available";
const BOOK_ALREADY_LOST = "Book already lost";

/**
 *
 * Route messages
 */

// Authenticated messages
const ACCOUNT_SUSPENDED = "Account suspended";
const AUTH_REQUIRED = "Authentication required";
const INVALID_CREDENTIALS = "Invalid credentials";
const PERMISSION_DENIED = "Permission denied";
const TOKEN_BLACKLISTED = "Token blacklisted";
const TOKEN_EXPIRED = "Token expired";
const TOKEN_INVALID = "Invalid token";

const MESSAGES = {
  SOCKET_NOT_INITIALIZED,
  SOCKET_INITIALIZED,
  TAG_NOT_GENERATED,
  SOCKET_AUTH_ERROR,
  OTP_SECRET_ERROR,
  EMAIL_INVALID,
  USER_NOT_FOUND,
  BOOK_CREATED,
  BOOK_UPDATED,
  BOOK_DELETED,
  BOOK_NOT_FOUND,
  BOOK_NOT_AVAILABLE,
  BOOK_RESERVED,
  BOOK_BORROWED,
  BOOK_RETURNED,
  BOOK_LOST,
  BOOK_ALREADY_BORROWED,
  BOOK_ALREADY_RESERVED,
  BOOK_ALREADY_RETURNED,
  BOOK_ALREADY_AVAILABLE,
  BOOK_ALREADY_LOST,
  AUTH_REQUIRED,
  PERMISSION_DENIED,
  INVALID_CREDENTIALS,
  TOKEN_BLACKLISTED,
  TOKEN_EXPIRED,
  ACCOUNT_SUSPENDED,
  INTERNAL_SERVER_ERROR,
  TOKEN_INVALID,
};

module.exports = {
  MESSAGES,
};
