const cron = require("node-cron");
const User = require("#models/User.js");
const { sendMail } = require("#common/Mailer.js");
const trigger = require("#config/cron.json").DailyDigest.cron;

// Daily digest email
cron.schedule(trigger, async () => {
  const users = await User.find({ subscribed: true });
  const htmlTemplate = require("config/EmailTemplates/DailyDigest");
  for (const user of users) {
    sendMail(user.email, "wordle Newsletter", htmlTemplate.replace("{{username}}", user.username));
  }
});
