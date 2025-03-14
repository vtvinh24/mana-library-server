const { log } = require("#common/Logger.js");
const User = require("#models/User.js");
const { isMongoId } = require("#common/Validator.js");

/**
 * Get books reserved by a specific user (admin/librarian only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservedBooksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isMongoId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find user and populate reserved books
    const user = await User.findById(userId).populate({
      path: "library.reservedBooks.book",
      select: "title author ISBN publisher publicationYear genre description coverImage status",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get query parameters for filtering
    const { status, startDate, endDate } = req.query;

    // Apply filters
    let reservedBooks = user.library.reservedBooks;

    if (status) {
      reservedBooks = reservedBooks.filter((item) => item.status === status.toUpperCase());
    }

    if (startDate) {
      const start = new Date(startDate);
      reservedBooks = reservedBooks.filter((item) => new Date(item.reservationDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      reservedBooks = reservedBooks.filter((item) => new Date(item.reservationDate) <= end);
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.identifier.username,
        name: user.profile.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}` : undefined,
      },
      count: reservedBooks.length,
      data: reservedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/reserved/:userId");
    return res.status(500).send();
  }
};

module.exports = { getReservedBooksByUser };
