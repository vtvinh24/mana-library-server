const fs = require("fs").promises;

/**
 * Reads a file's contents using UTF-8 encoding.
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string>} A promise that resolves with the file's contents.
 */
async function readFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Saves data to a file, overwriting the file if it already exists.
 * UTF-8 encoding is used to write the file.
 * @param {string} filePath - The path to the file to save.
 * @param {Buffer} data - The data to save to the file.
 * @returns {Promise<void>} A promise that resolves when the file has been saved.
 */
async function saveFile(filePath, data) {
  if (typeof data !== 'string' && !(data instanceof Buffer) && !ArrayBuffer.isView(data)) {
    throw new TypeError('The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView.');
  }

  try {
    await fs.writeFile(filePath, data, "utf8");
  } catch (err) {
    throw err;
  }
}

/**
 * Appends data to a file. UTF-8 encoding is used to write the file.
 * @param {string} filePath - The path to the file to append to.
 * @param {*} data - The data to append to the file.
 * @returns {Promise<void>} A promise that resolves when the data has been appended.
 */
async function appendToFile(filePath, data) {
  try {
    await fs.appendFile(filePath, data, "utf8");
  } catch (err) {
    throw err;
  }
}

/**
 * Deletes a file.
 * @param {string} filePath - The path to the file to delete.
 * @returns {Promise<void>} A promise that resolves when the file has been deleted.
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    throw err;
  }
}

/**
 * Checks if a file exists.
 * @param {string} filePath - The path to the file to check.
 * @returns {Promise<boolean>} A promise that resolves with true if the file exists, false otherwise.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Creates a directory, including any necessary parent directories.
 * @param {string} dirPath - The path to the directory to create.
 * @returns {Promise<void>} A promise that resolves when the directory has been created.
 */
async function createDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    throw err;
  }
}

/**
 * Reads the contents of a directory.
 * @param {string} dirPath - The path to the directory to read.
 * @returns {Promise<string[]>} A promise that resolves with an array of filenames in the directory.
 */
async function readDirectory(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    return files;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  readFile,
  saveFile,
  appendToFile,
  deleteFile,
  fileExists,
  createDirectory,
  readDirectory,
};
