const { logout } = require("#middlewares/JWT.js");
const { requireAuth } = require("#middlewares/JWT.js");
const express = require("express");
const router = express.Router();

// Ensure user is authenticated before logging out
router.post("/", requireAuth, logout);

module.exports = router;
