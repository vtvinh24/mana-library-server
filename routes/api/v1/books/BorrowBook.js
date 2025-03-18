const mongoose = require("mongoose");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Transaction = require("#models/Transaction.js");
const Reservation = require("#models/Reservation.js");
const { log } = require("#common/Logger.js");

/**
 * Borrow a book using atomic operations
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

    // First check if user exists and can borrow books
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for unpaid fines
    if (user.library.fines > 0) {
      return res.status(403).json({
        message: "You have unpaid fines",
        amount: user.library.fines,
        redirectTo: "/pay-fines",
      });
    }

    // Check if user already has this book
    const alreadyBorrowed = user.library.borrowedBooks.some((item) => item.book.toString() === bookId);
    if (alreadyBorrowed) {
      return res.status(400).json({ message: "You already have this book" });
    }

    // Check borrowing limit based on membership type
    const membershipType = user.library.membershipType || "standard";
    const borrowLimit =
      {
        standard: 5,
        premium: 10,
        student: 7,
        senior: 7,
      }[membershipType] || 5;

    if (user.library.borrowedBooks.length >= borrowLimit) {
      return res.status(403).json({
        message: `Borrowing limit of ${borrowLimit} books reached for your ${membershipType} membership`,
      });
    }

    // Check if book is available or reserved for this user
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    let canBorrow = false;
    let reservation = null;

    if (book.status === "available") {
      canBorrow = true;
    } else if (book.status === "reserved") {
      // Check if this user has a ready reservation for this book
      reservation = await Reservation.findOne({
        user: userId,
        book: bookId,
        status: "ready",
      });

      if (reservation) {
        canBorrow = true;
      }
    }

    if (!canBorrow) {
      if (book.status === "borrowed") {
        return res.status(400).json({ message: "Book is currently borrowed" });
      } else if (book.status === "reserved") {
        return res.status(400).json({ message: "Book is reserved by another user" });
      } else {
        return res.status(400).json({ message: "Book is not available for borrowing" });
      }
    }

    // All checks passed, proceed with borrowing the book
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

    // Update book status with atomic operation
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, $or: [{ status: "available" }, { status: "reserved" }] },
      {
        status: "borrowed",
        borrowedBy: userId,
        dueDate: dueDate,
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({ message: "Book is no longer available" });
    }

    // Update user's borrowed list with atomic operation
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: {
          "library.borrowedBooks": {
            book: bookId,
            borrowedAt: borrowDate,
            dueDate: dueDate,
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      // Revert book status if user update fails
      await Book.findOneAndUpdate({ _id: bookId }, { status: "available", borrowedBy: null, dueDate: null });
      return res.status(500).json({ message: "Failed to update user record" });
    }

    // If borrowed from reservation, update reservation status
    if (reservation) {
      await Reservation.findOneAndUpdate({ _id: reservation._id, status: "ready" }, { status: "fulfilled" });
    }

    // Create transaction record
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
    log(`Error in borrowBook: ${error.message}`, "ERROR", "API");
    console.error("Error stack:", error.stack);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { borrowBook };
