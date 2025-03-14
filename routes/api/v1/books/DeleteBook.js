const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");

/**
 * Delete a book from the library
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if the book is currently borrowed or reserved
    if (book.status === "borrowed" || book.status === "reserved") {
      // Find users who have borrowed or reserved this book
      const usersWithBook = await User.find({
        $or: [{ "library.borrowedBooks.book": bookId }, { "library.reservedBooks.book": bookId }],
      });

      if (usersWithBook.length > 0) {
        return res.status(400).json({
          message: "Cannot delete book that is currently borrowed or reserved",
          affectedUsers: usersWithBook.length,
        });
      }
    }

    // Perform a "soft delete" by setting deletedAt and deletedBy fields
    book.deletedAt = new Date();
    book.deletedBy = req.userId;
    await book.save();

    return res.status(200).json({ message: "Book successfully deleted" });
  } catch (err) {
    log(err.message, "ERROR", "routes DELETE /books/:bookId");
    return res.status(500).send();
  }
};

module.exports = { deleteBook };
