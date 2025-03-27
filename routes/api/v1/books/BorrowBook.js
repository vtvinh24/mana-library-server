const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Transaction = require("#models/Transaction.js");
const { log } = require("#common/Logger.js");

/**
 * Simplified route to borrow a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if book exists and has available copies
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book has available copies
    const availableCopies = book.copies.filter((copy) => copy.status === "available").length;
    if (availableCopies <= 0) {
      return res.status(400).json({ message: "No available copies of this book" });
    }

    // Find first available copy and update its status
    const copyIndex = book.copies.findIndex((copy) => copy.status === "available");
    book.copies[copyIndex].status = "borrowed";
    book.copies[copyIndex].userId = userId;
    await book.save();

    // Set loan period
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

    // Add book to user's borrowed list
    await User.findByIdAndUpdate(userId, {
      $push: {
        "library.borrowedBooks": {
          book: bookId,
          borrowDate: borrowDate,
          dueDate: dueDate,
          status: "BORROWED",
        },
      },
    });

    // Record the transaction
    await Transaction.create({
      user: userId,
      book: bookId,
      type: "borrow",
      date: borrowDate,
      dueDate,
    });

    log(`User ${userId} borrowed book ${bookId}`, "INFO", "TRANSACTION");
    return res.status(200).json({
      message: "Book borrowed successfully",
      dueDate,
    });
  } catch (error) {
    log(`Error borrowing book: ${error.message}`, "ERROR", "API");
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { borrowBook };
