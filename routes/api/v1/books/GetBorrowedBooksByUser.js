const { log } = require("#common/Logger.js");
const User = require("#models/User.js");
const { isMongoId } = require("#common/Validator.js");

/**
 * Get books borrowed by a specific user (admin/librarian only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBorrowedBooksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isMongoId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Find user and populate borrowed books
    const user = await User.findById(userId).populate({
      path: "library.borrowedBooks.book",
      select: "title author ISBN publisher publicationYear genre description coverImage status",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get query parameters for filtering
    const { status, startDate, endDate } = req.query;

    // Apply filters
    let borrowedBooks = user.library.borrowedBooks;

    if (status) {
      borrowedBooks = borrowedBooks.filter((item) => item.status === status.toUpperCase());
    }

    if (startDate) {
      const start = new Date(startDate);
      borrowedBooks = borrowedBooks.filter((item) => new Date(item.borrowDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      borrowedBooks = borrowedBooks.filter((item) => new Date(item.borrowDate) <= end);
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.identifier.username,
        name: user.profile.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}` : undefined,
      },
      count: borrowedBooks.length,
      data: borrowedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/borrowed/:userId");
    return res.status(500).send();
  }
};

module.exports = { getBorrowedBooksByUser };
