const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");
const Env = require("#config/Env.js");

const logsDir = path.join(__dirname, `../${Env.DIR_LOGS}`);
const latestLogPath = path.join(logsDir, "latest.log");

const levels = {
  ERROR: { value: 0, color: "\x1b[31m" }, // Red
  WARN: { value: 1, color: "\x1b[33m" }, // Yellow
  INFO: { value: 2, color: "\x1b[32m" }, // Green
  DEBUG: { value: 3, color: "\x1b[34m" }, // Blue
};

const consoleLogLevel = Env.LOGGER_LEVEL || "INFO";

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

if (fs.existsSync(latestLogPath)) {
  const stats = fs.statSync(latestLogPath);
  const modifiedTime = format(stats.mtime, "yyyyMMdd_HHmmss");
  const archivedLogPath = path.join(logsDir, `${modifiedTime}.log`);
  fs.renameSync(latestLogPath, archivedLogPath);
}

let logBuffer = "";

/**
 * Log a message to the console and write it to the log file
 *
 * @param {*} message The message to be logged
 * @param {*} level Log level (ERROR, WARN, INFO, DEBUG)
 * @param {*} prefix This is the prefix of the log message, which should be the name of the module or function that is logging the message
 */
async function log(message, level, prefix) {
  if (!level) {
    level = "INFO";
  }
  const logLevel = levels[level];
  if (!logLevel) {
    throw new Error(`Invalid log level: ${level}`);
  }

  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] [${prefix}] ${message}`;
  if (logLevel.value <= levels[consoleLogLevel].value) {
    const consoleMessage = `${logLevel.color}${logMessage}\x1b[0m`;
    console.log(consoleMessage);
  }
  logBuffer += `${logMessage}\n`;
}

async function flushLogBuffer() {
  fs.appendFileSync(latestLogPath, logBuffer);
  logBuffer = "";
}

setInterval(flushLogBuffer, 5000);
log("Logger initialized", "DEBUG", "Logger");
process.on("exit", flushLogBuffer);

module.exports = {
  log,
};
