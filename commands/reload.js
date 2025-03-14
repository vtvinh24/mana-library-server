const { log } = require("#common/Logger.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "reload",
  description: "Reloads environment and configuration without restarting",
  execute: () => {
    log("Reloading configuration...", "INFO", "Server");

    try {
      // Clear require cache for config files to ensure fresh data
      const configPath = path.join(__dirname, "../config");

      if (fs.existsSync(configPath)) {
        Object.keys(require.cache).forEach((key) => {
          if (key.startsWith(configPath)) {
            delete require.cache[key];
          }
        });
      }

      // Reload environment variables
      require("dotenv").config();

      log("Configuration reloaded successfully", "SUCCESS", "Server");
    } catch (error) {
      log(`Failed to reload configuration: ${error.message}`, "ERROR", "Server");
    }
  },
};
