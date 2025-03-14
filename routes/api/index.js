const { notFoundHandler, errorHandler } = require("#middlewares/ErrorHandler.js");
const express = require("express");
const router = express.Router();

router.use("/v1", require("./v1"));
// router.use("/test", require("./test"));
router.use(notFoundHandler);
router.use(errorHandler);

module.exports = router;
