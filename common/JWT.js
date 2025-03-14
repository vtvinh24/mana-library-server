const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Env = require("#config/Env.js");

let privateKey, publicKey;

// Load RSA keys if using asymmetric encryption
if (Env.JWT_ALGORITHM.startsWith("RS")) {
  try {
    privateKey = fs.readFileSync(path.join(process.cwd(), "keys", "private.key"), "utf8");
    publicKey = fs.readFileSync(path.join(process.cwd(), "keys", "public.key"), "utf8");
  } catch (error) {
    console.error("Error loading RSA keys:", error.message);
  }
}

// Use appropriate key based on algorithm
const getSecret = () => (Env.JWT_ALGORITHM.startsWith("RS") ? privateKey : Env.JWT_SECRET);
const getVerifySecret = () => (Env.JWT_ALGORITHM.startsWith("RS") ? publicKey : Env.JWT_SECRET);

/**
 * Creates a JWT token with unique identifier
 * @param {string} userId - User ID to include in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const createToken = (userId, expiresIn = Env.JWT_EXPIRES_IN) => {
  // Generate a unique token ID for potential revocation
  const jti = crypto.randomBytes(8).toString("hex");

  return jwt.sign(
    {
      payload: userId,
      jti, // Include the token ID
    },
    getSecret(),
    {
      algorithm: Env.JWT_ALGORITHM,
      expiresIn: expiresIn,
      issuer: Env.JWT_ISSUER,
    }
  );
};

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, getVerifySecret(), {
    algorithms: [Env.JWT_ALGORITHM],
    issuer: Env.JWT_ISSUER,
  });
};

module.exports = { createToken, verifyToken };
