const { ROLE, LANGUAGE, BOOK_STATUS, BOOK_CONDITION, BOOK_GENRE, DEWEY_DECIMAL_CATEGORIES, MEDIA_TYPE, MEDIA_FORMAT, NOTIFICATION_STATUS } = require("#enum/Fields.js");

/**
 * This function checks if the given email is valid
 * @param {string} email The email to validate
 * @returns {boolean}
 */
const isEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * This function checks if the given id is a valid MongoDB ObjectId, which is a 24-character hexadecimal string
 * @param {string} id
 * @returns {boolean}
 */
const isMongoId = (id) => {
  const pattern = /^[0-9a-fA-F]{24}$/;
  return pattern.test(id);
};

/**
 * This function checks if the given number is numeric
 * @param {string} num
 * @returns {boolean}
 */
const isNumeric = (num) => {
  return /^\d+$/.test(num);
};

/**
 * This function checks if the given string is alphanumeric
 * @param {string} str
 * @returns {boolean}
 */
const isAlphaNumeric = (str) => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * This function checks if the given language is valid
 * @param {string} str
 * @returns {boolean}
 */
const isLanguage = (str) => {
  return LANGUAGE.includes(str);
};

/**
 * This function checks if the given role is valid
 * @param {string} role
 * @returns {boolean}
 */
const isRole = (role) => {
  return ROLE.includes(role);
};

/**
 * This function checks if the given book status is valid
 * @param {string} status
 * @returns {boolean}
 */
const isBookStatus = (status) => {
  return BOOK_STATUS.includes(status);
};

/**
 * This function checks if the given book condition is valid
 * @param {string} condition
 * @returns {boolean}
 */
const isBookCondition = (condition) => {
  return BOOK_CONDITION.includes(condition);
};

/**
 * This function checks if the given book genre is valid
 * @param {string} genre
 * @returns {boolean}
 */
const isBookGenre = (genre) => {
  return BOOK_GENRE.includes(genre);
};

/**
 * This function checks if the given Dewey Decimal category is valid
 * @param {string} category
 * @returns {boolean}
 */
const isDeweyDecimalCategory = (category) => {
  return DEWEY_DECIMAL_CATEGORIES.includes(category);
};

/**
 * This function checks if the given media type is valid
 * @param {string} type
 * @returns {boolean}
 */
const isMediaType = (type) => {
  return MEDIA_TYPE.includes(type);
};

/**
 * This function checks if the given media format is valid
 * @param {string} format
 * @returns {boolean}
 */
const isMediaFormat = (format) => {
  return MEDIA_FORMAT.includes(format);
};

/**
 * This function checks if the given notification status is valid
 * @param {string} status
 * @returns {boolean}
 */
const isNotificationStatus = (status) => {
  return NOTIFICATION_STATUS.includes(status);
};

/**
 * This function checks if the given URL is valid
 * @param {string} url
 * @returns {boolean}
 */
const isUrl = (url) => {
  return /^(http|https):\/\/[^ "]+$/.test(url);
};

/**
 * This function checks if the given path is valid
 * @param {string} path
 * @returns {boolean}
 */
const isPath = (path) => {
  return /^\/[^ "]+$/.test(path);
};

/**
 * This function checks if the given string is base64 encoded
 * @param {string} str
 * @returns {boolean}
 */
const isBase64 = (str) => {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str);
};

/**
 * This function validates an ISBN (International Standard Book Number)
 * @param {string} isbn
 * @returns {boolean}
 */
const isISBN = (isbn) => {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, "");

  // ISBN-10 validation
  if (cleanISBN.length === 10) {
    if (!/^\d{9}[\dX]$/i.test(cleanISBN)) return false;

    // Calculate ISBN-10 checksum
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += (10 - i) * parseInt(cleanISBN.charAt(i));
    }

    // Check digit can be 'X' (representing 10)
    const checkDigit = cleanISBN.charAt(9).toUpperCase() === "X" ? 10 : parseInt(cleanISBN.charAt(9));
    return (sum + checkDigit) % 11 === 0;
  }

  // ISBN-13 validation
  else if (cleanISBN.length === 13) {
    if (!/^\d{13}$/.test(cleanISBN)) return false;

    // Calculate ISBN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += (i % 2 === 0 ? 1 : 3) * parseInt(cleanISBN.charAt(i));
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(cleanISBN.charAt(12)) === checkDigit;
  }

  return false;
};

module.exports = {
  isEmail,
  isMongoId,
  isNumeric,
  isAlphaNumeric,
  isLanguage,
  isRole,
  isBookStatus,
  isBookCondition,
  isBookGenre,
  isDeweyDecimalCategory,
  isMediaType,
  isMediaFormat,
  isNotificationStatus,
  isUrl,
  isPath,
  isBase64,
  isISBN,
};
