const express = require("express");
const router = express.Router();
const { requireAuth, requireRoles } = require("#middlewares/JWT.js");
const { ROLE } = require("#enum/Role.js");
const { getFavorites, addFavorite, removeFavorite } = require("./Favorites.js");
const { getNotifications, markAsRead, markAllAsRead } = require("./Notifications.js");
const { getUsers } = require("./GetUsers.js");
const { getUserById } = require("./GetUserById.js");
const { getProfile } = require("./GetProfile.js");
const { updateProfile } = require("./UpdateProfile.js");
const { createUser } = require("./CreateUser.js");
const { updateUser } = require("./UpdateUser.js");
const { deleteUser } = require("./DeleteUser.js");

// User CRUD routes
router.get("/", requireAuth, requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), getUsers);
router.get("/:userId", requireAuth, requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), getUserById);
router.post("/", requireAuth, requireRoles([ROLE.ADMIN]), createUser);
router.patch("/:userId", requireAuth, requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), updateUser);
router.delete("/:userId", requireAuth, requireRoles([ROLE.ADMIN]), deleteUser);

// Profile routes (for user to access their own data)
router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);

// User favorites routes
router.get("/favorites", requireAuth, getFavorites);
router.post("/favorites/:bookId", requireAuth, addFavorite);
router.delete("/favorites/:bookId", requireAuth, removeFavorite);

// User notifications routes
router.get("/notifications", requireAuth, getNotifications);
router.post("/notifications/:notificationId/read", requireAuth, markAsRead);
router.post("/notifications/read-all", requireAuth, markAllAsRead);

module.exports = router;
