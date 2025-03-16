const mongoose = require("mongoose");
const { log } = require("./Logger");
const Env = require("#config/Env.js");

const runningMode = Env.RUNNING_MODE || "standalone";
const dbHost = runningMode === "docker" ? "db" : Env.DB_HOST || "localhost";
const dbPort = Env.DB_PORT;
const dbName = Env.DB_DATABASE;
const dbUser = Env.DB_USER;
const dbPassword = Env.DB_PASSWORD;
const retryDelay = Env.DB_RETRY_DELAY;
const retryCount = Env.DB_RETRY_COUNT;

const connectString = `mongodb://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;

class Database {
  constructor() {
    this.retryCount = retryCount;
    this.retryDelay = retryDelay;
    this.connectString = connectString;
    this.connect();
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }

  connect(type = "Mongoose") {
    mongoose.set("debug", (collectionName, methodName, ...methodArgs) => {
      const message = `${collectionName}.${methodName}(${methodArgs.map((arg) => JSON.stringify(arg)).join(", ")})`;
      log(message, "DEBUG", "Mongoose");
    });

    this.connectWithRetry(type);
  }

  connectWithRetry(type) {
    mongoose
      .connect(this.connectString)
      .then(() => log(`Connected to ${type} successfully`, "DEBUG", type))
      .catch((err) => {
        log(err.message, "ERROR", type);
        if (this.retryCount > 0) {
          log(`Retrying to connect in ${this.retryDelay / 1000} seconds...`, "WARN", type);
          setTimeout(() => this.connectWithRetry(type, --this.retryCount), this.retryDelay);
        } else {
          log("Failed to connect to the database after multiple attempts", "ERROR", type);
        }
      });
  }
}

const Mongoose = Database.getInstance();
log("Mongoose initialized", "DEBUG", "Mongoose");

module.exports = Mongoose;
