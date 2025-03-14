const express = require("express");
const router = express.Router();
const { toggle2FA, generate2FA } = require("./TwoFactor");
const { requireAuth } = require("#middlewares/JWT.js");
const { authLimiter, passwordResetLimiter } = require("#middlewares/RateLimit.js");

const { login } = require("./Login");
router.post("/login", authLimiter, login);

// Add logout route
const logoutRouter = require("./Logout");
router.use("/logout", logoutRouter);

const { register } = require("./Register");
router.post("/register", register);

const { resetPassword, requestReset } = require("./ResetPassword");
router.post("/reset-request", passwordResetLimiter, requestReset);
router.post("/reset", passwordResetLimiter, resetPassword);

const { verify, sendCode } = require("./VerifyAccount");
router.post("/verify", requireAuth, verify);
router.post("/send-code", sendCode);

router.get("/2fa", requireAuth, generate2FA);
router.put("/2fa", requireAuth, toggle2FA);

const { refresh } = require("./Refresh");
router.post("/refresh", requireAuth, refresh);

module.exports = router;
