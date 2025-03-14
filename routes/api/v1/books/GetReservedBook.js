const { log } = require("#common/Logger.js");
const User = require("#models/User.js");

/**
 * Get books currently reserved by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservedBooks = async (req, res) => {
  try {
    const userId = req.userId;

    // Find user and populate reserved books
    const user = await User.findById(userId).populate({
      path: "library.reservedBooks.book",
      select: "title author ISBN publisher publicationYear genre description coverImage status",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter only active reservations
    const reservedBooks = user.library.reservedBooks.filter((item) => item.status === "ACTIVE");

    return res.status(200).json({
      count: reservedBooks.length,
      data: reservedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/reserved");
    return res.status(500).send();
  }
};

module.exports = { getReservedBooks };
