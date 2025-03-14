const User = require("#models/User.js");
const { log } = require("#common/Logger.js");

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("notifications");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sort notifications by date, newest first
    const sortedNotifications = [...(user.notifications || [])].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      notifications: sortedNotifications,
      unreadCount: sortedNotifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    log(`Error fetching notifications: ${error.message}`, "ERROR", "NOTIFICATIONS");
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and update notification
    const notification = user.notifications?.id(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await user.save();

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    log(`Error marking notification as read: ${error.message}`, "ERROR", "NOTIFICATIONS");
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark all notifications as read
    if (user.notifications && user.notifications.length) {
      user.notifications.forEach((notification) => {
        notification.read = true;
      });

      await user.save();
    }

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    log(`Error marking all notifications as read: ${error.message}`, "ERROR", "NOTIFICATIONS");
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
