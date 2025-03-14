const express = require("express");
const router = express.Router();
const { requireAuth, requireRoles } = require("#middlewares/JWT.js");
const { ROLE } = require("#enum/Role.js");

// Admin metrics route needs to be implemented
router.get("/metrics", requireAuth, requireRoles([ROLE.ADMIN]), (req, res) => {
  // Temporary implementation until full metrics are implemented
  const metrics = {
    users: {
      total: 0,
      new: 0,
      roles: {},
    },
    books: {
      total: 0,
      new: 0,
      borrowed: 0,
      reserved: 0,
      popular: [],
    },
  };

  res.status(200).json(metrics);
});

module.exports = router;
