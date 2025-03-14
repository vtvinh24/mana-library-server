const { log } = require("../common/Logger");

module.exports = {
  name: "clear",
  description: "Clear logs in console",
  execute: () => {
    // Get terminal dimensions
    const rows = process.stdout.rows || 30; // Default to 30 if can't detect

    // Clear the terminal
    process.stdout.write("\x1Bc");

    // Log how many lines were cleared
    log(`Cleared ${rows} lines`, "INFO", "System");
  },
};
