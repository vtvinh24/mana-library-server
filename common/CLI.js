const readline = require("readline");
const { log } = require("./Logger");

const commands = {};
let rl;

function addCommandListener(cmd, callback) {
  commands[cmd] = callback;
}

function useCLI() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
  });

  // Don't prompt immediately - wait for initialization logs
  setTimeout(() => {
    rl.prompt();
  }, 1000); // Wait 1 second for initial logs to complete

  rl.on("line", (line) => {
    const trimmedLine = line.trim();
    const [command, ...args] = trimmedLine.split(" ");

    if (commands[command]) {
      try {
        commands[command](...args);
      } catch (error) {
        log(`Error executing command: ${error.message}`, "ERROR", "Server");
      }
    } else if (trimmedLine) {
      // Only log error for non-empty commands
      log(`Unknown command: '${command}'`, "ERROR", "Server");
    }
    rl.prompt();
  });
}

// Add this function to allow re-prompting from other modules
function refreshPrompt() {
  if (rl) {
    rl.prompt();
  }
}

module.exports = {
  addCommandListener,
  useCLI,
  refreshPrompt,
  commands,
};
