const express = require("express");
const router = express.Router();

// Root API endpoint
router.use("/", require("./_root"));

// Authentication routes - login, register, reset, verify, 2FA
router.use("/auth", require("./auth"));

// Book management routes - CRUD, search, borrow, reserve
router.use("/books", require("./books"));

// User management routes - profiles, favorites, notifications
router.use("/users", require("./users"));

// Admin dashboard and metrics
router.use("/admin", require("./admin"));

module.exports = router;
