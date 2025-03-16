const fs = require("fs");
const path = require("path");
const { log } = require("#common/Logger.js");

// Directory containing the cron scripts
const schedulersDir = path.join(__dirname, "schedulers");
const config = require("#config/cron.json");

function initializeCronJobs() {
  // Read the contents of the schedulers directory
  fs.readdir(schedulersDir, (err, files) => {
    if (err) {
      log("Error reading schedulers directory", "ERROR", "node-cron");
      return;
    }

    // Filter out non-JavaScript files
    const jsFiles = files.filter((file) => file.endsWith(".js"));

    // Require and execute each JavaScript file
    let count = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;
    jsFiles.forEach((file) => {
      count++;
      const filePath = path.join(schedulersDir, file);
      const fileName = path.basename(filePath).replace(".js", "");
      try {
        if (!config[fileName].enabled) {
          log(`Skipped ${file}`, "DEBUG", "node-cron");
          skipped++;
          return;
        }
        require(filePath);
        log(`Deployed ${file}`, "DEBUG", "node-cron");
        success++;
      } catch (err) {
        log(`Failed to deploy ${file}: ${err.message}`, "ERROR", "node-cron");
        failed++;
      }
    });

    log(`Deployed cron jobs. \n\t\x1b[31m${failed} failed\x1b[0m\n\t\x1b[32m${success} success\x1b[0m\n\t\x1b[33m${skipped} skipped\x1b[0m\n\t\x1b[34m${count} total\x1b[0m`, "INFO", "node-cron");
  });
}

module.exports = initializeCronJobs;
