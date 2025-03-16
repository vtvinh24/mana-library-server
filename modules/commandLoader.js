const fs = require("fs");
const path = require("path");
const CLI = require("#common/CLI.js");
const { log } = require("#common/Logger.js");

/**
 * Loads all command modules from the commands directory
 */
function loadCommands() {
  const commandsDir = path.join(__dirname, "../commands");

  try {
    // Get all JS files in the commands directory
    const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith(".js"));

    log(`Found ${commandFiles.length} command files`, "INFO", "CommandLoader");

    // Load each command file
    commandFiles.forEach((file) => {
      try {
        const commandPath = path.join(commandsDir, file);
        const command = require(commandPath);

        // Register the command
        if (command.name && typeof command.execute === "function") {
          CLI.addCommandListener(command.name, command.execute);
          log(`Registered command: ${command.name}`, "DEBUG", "CommandLoader");
        } else {
          log(`Invalid command format in file: ${file}`, "WARN", "CommandLoader");
        }
      } catch (error) {
        log(`Error loading command file ${file}: ${error.message}`, "ERROR", "CommandLoader");
      }
    });

    // Register a help command that shows all available commands
    CLI.addCommandListener("help", () => {
      log("Available commands: ", "INFO", "Server");
      Object.keys(require("#common/CLI.js").commands || {}).forEach((cmd) => {
        log(`- ${cmd}`, "INFO", "Server");
      });
    });
  } catch (error) {
    log(`Error loading commands: ${error.message}`, "ERROR", "CommandLoader");
  }
}

module.exports = { loadCommands };
