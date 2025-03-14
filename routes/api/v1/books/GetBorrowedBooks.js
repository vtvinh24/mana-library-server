const { log } = require("#common/Logger.js");
const User = require("#models/User.js");

/**
 * Get books currently borrowed by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBorrowedBooks = async (req, res) => {
  try {
    const userId = req.userId;

    // Find user and populate borrowed books
    const user = await User.findById(userId).populate({
      path: "library.borrowedBooks.book",
      select: "title author ISBN publisher publicationYear genre description coverImage status",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter only currently borrowed books (not returned)
    const borrowedBooks = user.library.borrowedBooks.filter((item) => item.status === "BORROWED");

    return res.status(200).json({
      count: borrowedBooks.length,
      data: borrowedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/borrowed");
    return res.status(500).send();
  }
};

module.exports = { getBorrowedBooks };
