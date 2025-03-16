const { log } = require("#common/Logger.js");
const config = require("#config/cron.json");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "cron",
  description: "Lists all cron schedulers and their statuses",
  execute: () => {
    try {
      log("Cron Schedulers Status:", "INFO", "Server");

      // Get list of actual scheduler files
      const schedulersDir = path.join(__dirname, "../services/schedulers");
      const schedulerFiles = fs
        .readdirSync(schedulersDir)
        .filter((file) => file.endsWith(".js"))
        .map((file) => path.basename(file, ".js"));

      // Display each scheduler with its status
      Object.keys(config).forEach((schedulerName) => {
        const scheduler = config[schedulerName];
        const status = scheduler.enabled ? "\x1b[32mENABLED\x1b[0m" : "\x1b[31mDISABLED\x1b[0m";
        const fileExists = schedulerFiles.includes(schedulerName);
        const fileStatus = fileExists ? "" : " \x1b[33m(File not found)\x1b[0m";

        log(`- ${schedulerName}: ${status}${fileStatus}`, "INFO", "Server");
        log(`  Schedule: ${scheduler.cron}`, "INFO", "Server");
      });

      // Find any scheduler files that aren't in config
      const unconfigured = schedulerFiles.filter((file) => !config[file]);
      if (unconfigured.length > 0) {
        log("\nUnconfigured scheduler files:", "WARN", "Server");
        unconfigured.forEach((file) => {
          log(`- ${file}`, "WARN", "Server");
        });
      }
    } catch (error) {
      log(`Error listing cron schedulers: ${error.message}`, "ERROR", "Server");
    }
  },
};
