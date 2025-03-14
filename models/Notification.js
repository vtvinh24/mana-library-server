const mongoose = require("mongoose");
const baseSchema = require("./Base");
const { NOTIFICATION_STATUS } = require("#enum/Fields.js");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: NOTIFICATION_STATUS,
      default: NOTIFICATION_STATUS[0],
      required: true,
    },
  }
);

notificationSchema.add(baseSchema);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;

