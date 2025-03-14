const express = require("express");
const router = express.Router();

const { getRoot } = require("./Get");
router.get("/", getRoot);

module.exports = router;
