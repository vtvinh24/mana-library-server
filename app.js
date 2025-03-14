const Env = require("#config/Env.js");
const express = require("express");
const app = express();

require("./common/Greet").showGreeting();

const { log } = require("#common/Logger.js");

require("./common/Mongoose");

const applyMiddlewares = require("./middlewares");
applyMiddlewares(app);

const api = require("#routes/api/index.js");
app.use("/api", api);

let port = Env.APP_PORT || 8000;
const server = app
  .listen(port, () => {
    log(`Server is running on port ${port}`, "DEBUG", "Server");
  })
  .on("error", handleServerError);

const { init } = require("#common/Io.js");
init(server);

const { loadCommands } = require("#modules/commandLoader.js");
const { useCLI } = require("#common/CLI.js");
const { showGreeting } = require("#common/Greet.js");

loadCommands();
useCLI();

function handleServerError(err) {
  if (err.code === "EADDRINUSE") {
    log(`Port ${port} is already in use`, "ERROR");
    port++;
    server.listen(port);
  } else {
    log(err.message, "ERROR");
  }
}
