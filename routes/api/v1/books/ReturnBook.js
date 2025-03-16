const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Reservation = require("#models/Reservation.js");
const Transaction = require("#models/Transaction.js");
const { startSession } = require("mongoose");

const returnBook = async (req, res) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const { userId, bookId } = req.body;

    if (!userId || !bookId) {
      return res.status(400).json({ message: "User ID and Book ID are required" });
    }

    // Find book and user with session to prevent race conditions
    const book = await Book.findById(bookId).session(session);
    const user = await User.findById(userId).session(session);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has borrowed this book
    const borrowedBook = user.library.borrowed.find((item) => item.book.toString() === bookId);

    if (!borrowedBook) {
      return res.status(400).json({ message: "You haven't borrowed this book" });
    }

    // Calculate late fee if applicable
    const borrowDate = new Date(borrowedBook.borrowDate);
    const dueDate = new Date(borrowedBook.dueDate);
    const returnDate = new Date();
    let lateFee = 0;

    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      // Use configuration value instead of hardcoding the fee
      const feePerDay = book.lateFeeDailyRate || 0.1; // Default to $0.10 if not configured
      lateFee = daysLate * feePerDay;
      user.library.fines += lateFee;
    }

    // Update user's borrowed books
    user.library.borrowed = user.library.borrowed.filter((item) => item.book.toString() !== bookId);

    // Create transaction record
    await Transaction.create({
      user: userId,
      book: bookId,
      type: "return",
      date: returnDate,
      lateFee,
    });

    // Check for pending reservations
    const pendingReservations = await Reservation.find({
      book: bookId,
      status: "pending",
    })
      .sort({ createdAt: 1 })
      .session(session);

    // Update book status based on reservations
    if (pendingReservations.length > 0) {
      // Book has pending reservations, mark it as reserved
      book.status = "reserved";

      // Update the first reservation to ready
      const nextReservation = pendingReservations[0];
      nextReservation.status = "ready";
      nextReservation.notifiedAt = new Date();
      await nextReservation.save({ session });

      // TODO: Notify user that reservation is ready
    } else {
      // No pending reservations, mark as available
      book.status = "available";
    }

    await user.save({ session });
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Book returned successfully",
      lateFee: lateFee > 0 ? lateFee : undefined,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error returning book:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { returnBook };
