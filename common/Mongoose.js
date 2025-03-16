const mongoose = require("mongoose");
const { log } = require("./Logger");
const Env = require("#config/Env.js");

class Database {
  constructor() {
    // Set configuration from environment
    this.dbHost = Env.RUNNING_MODE === "docker" ? "db" : Env.DB_HOST;
    this.dbPort = Env.DB_PORT;
    this.dbName = Env.DB_DATABASE || "ManaLibrary";
    this.dbUser = Env.DB_USER;
    this.dbPassword = Env.DB_PASSWORD;
    this.retryDelay = parseInt(Env.DB_RETRY_DELAY);
    this.maxRetries = parseInt(Env.DB_RETRY_COUNT);
    this.currentRetry = 0;

    // Build connection string
    this.connectString =
      this.dbUser && this.dbPassword
        ? `mongodb://${this.dbUser}:${encodeURIComponent(this.dbPassword)}@${this.dbHost}:${this.dbPort}/${this.dbName}?authSource=admin`
        : `mongodb://${this.dbHost}:${this.dbPort}/${this.dbName}`;

    // Set connection options
    this.connectionOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    this.connect();
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  connect(type = "Mongoose") {
    // Only enable mongoose debug in non-production environments
    if (Env.NODE_ENV !== "production" && Env.LOGGER_LEVEL === "DEBUG") {
      mongoose.set("debug", (collectionName, methodName, ...methodArgs) => {
        const message = `${collectionName}.${methodName}(${methodArgs.map((arg) => JSON.stringify(arg)).join(", ")})`;
        log(message, "DEBUG", "Mongoose");
      });
    }

    this.connectWithRetry(type);
  }

  connectWithRetry(type) {
    log(`Connecting to MongoDB at ${this.dbHost}:${this.dbPort}/${this.dbName}...`, "INFO", type);

    mongoose
      .connect(this.connectString, this.connectionOptions)
      .then(() => {
        log(`Connected to MongoDB successfully`, "INFO", type);
        // Reset retry counter on successful connection
        this.currentRetry = 0;

        // Handle connection events
        mongoose.connection.on("error", (err) => {
          log(`MongoDB connection error: ${err.message}`, "ERROR", type);
        });

        mongoose.connection.on("disconnected", () => {
          log(`MongoDB disconnected, attempting to reconnect...`, "WARN", type);
          this.connectWithRetry(type);
        });
      })
      .catch((err) => {
        log(`MongoDB connection error: ${err.message}`, "ERROR", type);

        if (this.currentRetry < this.maxRetries) {
          this.currentRetry++;
          log(`Retrying to connect (${this.currentRetry}/${this.maxRetries}) in ${this.retryDelay / 1000} seconds...`, "WARN", type);
          setTimeout(() => this.connectWithRetry(type), this.retryDelay);
        } else {
          log("Failed to connect to MongoDB after maximum retry attempts", "ERROR", type);
          // In production, you might want to exit the process
          if (Env.NODE_ENV === "production") {
            log("Exiting process due to database connection failure", "ERROR", type);
            process.exit(1);
          }
        }
      });
  }
}

const Mongoose = Database.getInstance();
log("Mongoose database connection initialized", "DEBUG", "Mongoose");

module.exports = Mongoose;
