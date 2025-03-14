const { log } = require("../common/Logger");

module.exports = {
  name: "me",
  description: "Shows my status",
  execute: () => {
    log("Server is running normally", "INFO", "Server");
  },
};
