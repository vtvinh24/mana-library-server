/**
 * This function calculate the complexity of a password.
 *
 * Criteria:
 * 1. 8 characters or more
 * 2. Contains uppercase letters
 * 3. Contains lowercase letters
 * 4. Contains numbers
 * 5. Contains symbols
 *
 * For each criteria met, the complexity increases by 1.
 *
 * Minimum complexity is 0, maximum complexity is 5.
 *
 * @param {string} password
 * @returns
 */
const getComplexity = (password) => {
  let complexity = 0;
  const length = password.length;
  const upperCase = password.match(/[A-Z]/g);
  const lowerCase = password.match(/[a-z]/g);
  const numbers = password.match(/[0-9]/g);
  const symbols = password.match(/[^a-zA-Z0-9]/g);
  const requirements = [length >= 8, upperCase, lowerCase, numbers, symbols];

  for (const requirement of requirements) {
    if (requirement) {
      complexity++;
    }
  }

  return complexity;
};

/**
 * This function generates a random password using standard ASCII characters.
 * @param {number} [length=12] The length of the password
 * @returns {string} The generated password
 */
const generatePassword = (length) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};

module.exports = { getComplexity, generatePassword };
