const mongoose = require("mongoose");
const baseSchema = require("./Base");
const Schema = mongoose.Schema;

const reservationSchema = new mongoose.Schema(
  {
    // Reference to the user who made the reservation
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference to the book being reserved
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    // Status of the reservation
    // pending: waiting for book to become available
    // ready: book is ready for pickup
    // completed: book was borrowed by the user
    // expired: user didn't pick up the book within the time limit
    // cancelled: user cancelled the reservation
    status: {
      type: String,
      enum: ["pending", "ready", "completed", "expired", "cancelled"],
      default: "pending",
      required: true,
    },

    // When the user was notified that the book is ready
    // Only set when status changes to "ready"
    notifiedAt: {
      type: Date,
      default: null,
    },

    // When the reservation expires (typically 3 days after notification)
    // Only set when status is "ready"
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.add(baseSchema);

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
