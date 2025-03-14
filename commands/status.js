const { log } = require("#common/Logger.js");
const os = require("os");

module.exports = {
  name: "status",
  description: "Shows detailed server status information",
  execute: () => {
    try {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const memoryUsage = process.memoryUsage();
      const freeMem = os.freemem() / 1024 / 1024;
      const totalMem = os.totalmem() / 1024 / 1024;

      log(`Server Status Report`, "INFO", "Server");
      log(`Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`, "INFO", "Server");
      log(`Memory: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB used / ${Math.round(totalMem)}MB total (${Math.round(freeMem)}MB free)`, "INFO", "Server");
      log(
        `CPU Load: ${os
          .loadavg()
          .map((load) => load.toFixed(2))
          .join(", ")}`,
        "INFO",
        "Server"
      );
      log(`Platform: ${os.platform()} (${os.release()})`, "INFO", "Server");
      log(`Node Version: ${process.version}`, "INFO", "Server");
    } catch (error) {
      log(`Error getting server status: ${error.message}`, "ERROR", "Server");
    }
  },
};
