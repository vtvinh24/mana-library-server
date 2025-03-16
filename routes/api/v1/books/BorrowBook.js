const mongoose = require("mongoose");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Transaction = require("#models/Transaction.js");
const Reservation = require("#models/Reservation.js");
const { log } = require("#common/Logger.js");

/**
 * Borrow a book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const borrowBook = async (req, res) => {
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookId } = req.params;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }

    // Find user and book with session to prevent race conditions
    const user = await User.findById(userId).session(session);
    const book = await Book.findById(bookId).session(session);

    // Check if resources exist
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    if (!book) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Book not found" });
    }

    // Check for unpaid fines
    if (user.library.fines > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        message: "You have unpaid fines",
        amount: user.library.fines,
        redirectTo: "/pay-fines",
      });
    }

    // Check if user already has this book
    const alreadyBorrowed = user.library.borrowed.some((item) => item.book.toString() === bookId);
    if (alreadyBorrowed) {
      await session.abortTransaction();
      session.endSession();
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

    if (user.library.borrowed.length >= borrowLimit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        message: `Borrowing limit of ${borrowLimit} books reached for your ${membershipType} membership`,
      });
    }

    // Check if book is available or reserved for this user
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
      }).session(session);

      if (reservation) {
        canBorrow = true;
      }
    }

    if (canBorrow) {
      try {
        // Set borrow and due dates
        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

        // Update book status
        book.status = "borrowed";
        book.borrowedBy = userId;
        book.dueDate = dueDate;

        // Add book to user's borrowed list
        user.library.borrowed.push({
          book: bookId,
          borrowedAt: borrowDate,
          dueDate: dueDate,
        });

        // If borrowed from reservation, update reservation status
        if (reservation) {
          reservation.status = "fulfilled";
          await reservation.save({ session });
        }

        // Create transaction record
        await Transaction.create(
          [
            {
              user: userId,
              book: bookId,
              type: "borrow",
              date: borrowDate,
              dueDate,
            },
          ],
          { session }
        );

        // Save all changes
        await user.save({ session });
        await book.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        log(`User ${userId} borrowed book ${bookId}`, "INFO", "TRANSACTION");
        return res.status(200).json({
          message: "Book borrowed successfully",
          dueDate,
        });
      } catch (dbError) {
        // Database error handling
        await session.abortTransaction();
        log(`Database error in borrowBook: ${dbError.message}`, "ERROR", "TRANSACTION");
        return res.status(500).json({ message: "Failed to process borrowing transaction" });
      }
    } else {
      await session.abortTransaction();

      if (book.status === "borrowed") {
        return res.status(400).json({ message: "Book is currently borrowed" });
      } else if (book.status === "reserved") {
        return res.status(400).json({ message: "Book is reserved by another user" });
      } else {
        return res.status(400).json({ message: "Book is not available for borrowing" });
      }
    }
  } catch (error) {
    // General error handling
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    log(`Error in borrowBook: ${error.message}`, "ERROR", "API");
    return res.status(500).json({ message: "Server error" });
  } finally {
    // Always end the session
    session.endSession();
  }
};

module.exports = { borrowBook };
