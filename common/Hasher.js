const crypto = require("crypto");
const base32 = require("hi-base32");

/**
 * Hashes a string using the specified salt and digest.
 * @param {string} string - The string to hash.
 * @param {string} [salt] - The salt to use for hashing. Defaults to an empty string.
 * @param {string} [digest] - The digest algorithm to use. Defaults to 'sha512'.
 * @param {number} [iterations] - The number of iterations to perform. Defaults to 10000.
 * @param {number} [keylen] - The length of the derived key. Defaults to 64.
 * @throws {Error} Invalid string to hash.
 * @throws {Error} Invalid hash algorithm.
 * @returns {Promise<string>} A promise that resolves with the hashed string.
 *
 * @example
 * const { getHash } = require("./Hasher");
 * const hash = await getHash("password", "salt");
 * // console.log(hash);
 */
function getHash(string, salt, digest, iterations, keylen) {
  return new Promise((resolve, reject) => {
    if (digest && !crypto.getHashes().includes(digest)) {
      reject(new Error(`Invalid hash algorithm: ${digest}`));
    }
    if (!string) {
      reject(new Error("Invalid string to hash"));
    }
    crypto.pbkdf2(string, salt || "", iterations || 10000, keylen || 64, digest || "sha512", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Generates a random salt.
 * @returns {Promise<string>} A promise that resolves with the generated salt.
 */
function generateSalt() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer.toString("hex"));
    });
  });
}

/**
 * This function generates a random base32 encoded string.
 * @returns {string} A base32 encoded string.
 */
function generateBase32() {
  const buffer = crypto.randomBytes(20);
  const base32String = base32.encode(buffer).replace(/=/g, "");
  return base32String.substring(0, 24);
}

module.exports = { getHash, generateSalt, generateBase32 };
