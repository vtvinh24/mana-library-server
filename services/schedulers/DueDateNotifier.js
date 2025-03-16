const cron = require("node-cron");
const User = require("#models/User.js");
const Book = require("#models/Book.js");
const { sendMail } = require("#common/Mailer.js");
const { log } = require("#common/Logger.js");
const config = require("#config/cron.json").DueDateNotifier;

// Due date notification scheduler
// Sends notifications to users with books due soon
cron.schedule(
  config.cron,
  async () => {
    if (!config.enabled) return;

    try {
      log("Running due date notifier", "INFO", "SCHEDULER");

      // Find users with books due soon (next 2 days)
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      const users = await User.find({
        "library.borrowed.dueDate": { $lte: twoDaysFromNow, $gt: new Date() },
        "library.notificationPreferences.notifyBeforeDueDate": true,
        "library.notificationPreferences.emailNotifications": true,
      }).populate("library.borrowed.book");

      for (const user of users) {
        // Get soon-due books for this user
        const soonDueBooks = user.library.borrowed.filter((item) => {
          return item.dueDate <= twoDaysFromNow && item.dueDate > new Date();
        });

        if (soonDueBooks.length > 0) {
          // Generate list of books for the email
          const bookList = soonDueBooks
            .map((item) => {
              const dueDate = item.dueDate.toLocaleDateString();
              return `- "${item.book.title}" due on ${dueDate}`;
            })
            .join("\n");

          // Send reminder email
          sendMail(
            user.email,
            "Books Due Soon Reminder",
            `Hello ${
              user.firstName || user.username
            },\n\nThis is a friendly reminder that you have the following books due soon:\n\n${bookList}\n\nPlease return them on time to avoid late fees.\n\nThank you,\nMana Library Team`
          );

          log(`Sent due date notification to user ${user._id}`, "INFO", "NOTIFICATION");
        }
      }

      // Also notify about overdue books
      const usersWithOverdueBooks = await User.find({
        "library.borrowed.dueDate": { $lt: new Date() },
        "library.notificationPreferences.emailNotifications": true,
      }).populate("library.borrowed.book");

      // [Implementation for overdue notifications would go here]
    } catch (error) {
      log(`Error sending due date notifications: ${error.message}`, "ERROR", "SCHEDULER");
    }
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);
