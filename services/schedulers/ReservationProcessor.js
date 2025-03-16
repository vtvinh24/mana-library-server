const cron = require("node-cron");
const Reservation = require("#models/Reservation.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const { sendMail } = require("#common/Mailer.js");
const { log } = require("#common/Logger.js");
const config = require("#config/cron.json").ReservationProcessor;

// Reservation processing scheduler
// - Finds and expires reservations that are past their hold time
// - Notifies next users in queue when books become available
cron.schedule(
  config.cron,
  async () => {
    if (!config.enabled) return;

    try {
      const now = new Date();
      log("Running reservation processor", "INFO", "SCHEDULER");

      // 1. Find and update expired reservations
      const expiredResult = await Reservation.updateMany({ status: "ready", expirationDate: { $lt: now } }, { $set: { status: "expired" } });

      if (expiredResult.modifiedCount > 0) {
        log(`Expired ${expiredResult.modifiedCount} reservations`, "INFO", "RESERVATION");
      }

      // 2. Process books that recently became available
      const availableBooks = await Book.find({ status: "available" });

      for (const book of availableBooks) {
        // Find the next pending reservation in queue for this book
        const nextReservation = await Reservation.findOne({
          book: book._id,
          status: "pending",
        })
          .sort({ createdAt: 1 })
          .populate("user");

        if (nextReservation) {
          // Update the reservation to "ready" status
          nextReservation.status = "ready";

          // Set expiration date (48 hours from now)
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + 48);
          nextReservation.expirationDate = expirationDate;

          // Mark book as reserved
          book.status = "reserved";

          // Save both documents
          await nextReservation.save();
          await book.save();

          // Notify user if they have email notifications enabled
          if (nextReservation.user?.library?.notificationPreferences?.emailNotifications) {
            sendMail(
              nextReservation.user.email,
              "Your Reserved Book is Available",
              `Your reserved book "${book.title}" is now available. Please pick it up within 48 hours or your reservation will expire.`
            );
          }

          log(`Notified user ${nextReservation.user?._id} about available book ${book._id}`, "INFO", "RESERVATION");
        }
      }
    } catch (error) {
      log(`Error processing reservations: ${error.message}`, "ERROR", "SCHEDULER");
    }
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);
