const { log } = require("#common/Logger.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "version",
  description: "Shows server version information",
  execute: () => {
    try {
      const packagePath = path.join(__dirname, "../package.json");

      if (!fs.existsSync(packagePath)) {
        log("Unable to determine version - package.json not found", "ERROR", "Server");
        return;
      }

      const packageInfo = require(packagePath);
      log(`${packageInfo.name} version ${packageInfo.version}`, "INFO", "Server");

      if (packageInfo.description) {
        log(packageInfo.description, "INFO", "Server");
      }

      log(`Node.js ${process.version}`, "INFO", "Server");
    } catch (error) {
      log(`Error retrieving version info: ${error.message}`, "ERROR", "Server");
    }
  },
};
