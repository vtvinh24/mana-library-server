/**
 * This function generates a random numeric code
 * @example generateNumericCode(6) => "241653"
 * @param {number} length The length of the code
 * @returns {string} The generated code
 */
const generateNumericCode = (length = 6) => {
  const numbers = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
};

/**
 * This function generates a random alphanumeric code
 * @example generateAlphaNumericCode(6) => "2a1BcD"
 * @param {number} [length=6] The length of the code
 * @returns {string} The generated code
 */
const generateAlphaNumericCode = (length) => {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

module.exports = {
  generateNumericCode,
  generateAlphaNumericCode,
};
