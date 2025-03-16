const { log } = require("#common/Logger.js");
const Env = require("#config/Env.js");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

module.exports = {
  name: "restart",
  description: "Restarts the server application",
  execute: () => {
    log("Initiating server restart...", "INFO", "Server");

    try {
      log("Preparing to restart services...", "INFO", "Server");

      // Detect if we're running on Windows
      const isWindows = os.platform() === "win32";

      // Get the command based on environment and platform
      const restartCommand = isWindows ? "npm.cmd" : "npm";
      const args = Env.NODE_ENV === "development" ? ["run", "dev"] : ["start"];

      // Spawn a new process that inherits the current terminal
      const child = spawn(restartCommand, args, {
        stdio: "inherit", // Inherit stdin/stdout/stderr from parent
        cwd: process.cwd(),
        shell: isWindows, // Use shell on Windows platforms
      });

      log("New server process initiated. Shutting down current instance...", "INFO", "Server");

      // Give some time for the log message to be processed
      setTimeout(() => {
        // Exit the current process with success code
        process.exit(0);
      }, 500);
    } catch (error) {
      log(`Failed to restart server: ${error.message}`, "ERROR", "Server");
    }
  },
};
