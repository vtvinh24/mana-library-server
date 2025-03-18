const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Reservation = require("#models/Reservation.js");
const Transaction = require("#models/Transaction.js");
const { log } = require("#common/Logger.js");

const returnBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    // Allow admin/librarian to return on behalf of another user
    // For normal users, use their own ID from authentication
    const { role } = req;
    let userId;
    if (role !== "admin" && role !== "librarian") {
      userId = req.body.userId || req.userId;
    } else userId = req.userId;

    if (!userId || !bookId) {
      return res.status(400).json({ message: "User ID and Book ID are required" });
    }

    // Find book and user (no session)
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has borrowed this book
    const borrowedBook = user.library.borrowedBooks.find((item) => item.book.toString() === bookId);

    if (!borrowedBook) {
      return res.status(400).json({ message: "User hasn't borrowed this book" });
    }

    // Calculate late fee if applicable
    const borrowDate = new Date(borrowedBook.borrowDate);
    const dueDate = new Date(borrowedBook.dueDate);
    const returnDate = new Date();
    let lateFee = 0;

    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const feePerDay = book.lateFeeDailyRate || 0.1; // Default to $0.10 if not configured
      lateFee = daysLate * feePerDay;
    }

    // Check for pending reservations
    const pendingReservations = await Reservation.find({
      book: bookId,
      status: "pending",
    }).sort({ createdAt: 1 });

    let newBookStatus = "available";
    let nextReservationId = null;

    // Update book status based on reservations
    if (pendingReservations.length > 0) {
      // Book has pending reservations, mark it as reserved
      newBookStatus = "reserved";
      nextReservationId = pendingReservations[0]._id;
    }

    // Update user's borrowed books with atomic operation
    const updateUserQuery = {
      $pull: { "library.borrowedBooks": { book: bookId } },
    };

    if (lateFee > 0) {
      updateUserQuery.$inc = { "library.fines": lateFee };
    }

    const updatedUser = await User.findOneAndUpdate({ _id: userId }, updateUserQuery, { new: true });

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user record" });
    }

    // Update book status with atomic operation
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId },
      {
        status: newBookStatus,
        borrowedBy: null,
        dueDate: null,
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(500).json({ message: "Failed to update book record" });
    }

    // Create transaction record for the return
    await Transaction.create({
      user: userId,
      book: bookId,
      type: "return",
      date: returnDate,
      lateFee,
    });

    // Update reservation if needed
    if (nextReservationId) {
      await Reservation.findOneAndUpdate(
        { _id: nextReservationId },
        {
          status: "ready",
          notifiedAt: new Date(),
        },
        { new: true }
      );
      // TODO: Notify user that reservation is ready
    }

    log(`User ${userId} returned book ${bookId}`, "INFO", "TRANSACTION");
    return res.status(200).json({
      message: "Book returned successfully",
      lateFee: lateFee > 0 ? lateFee : undefined,
    });
  } catch (error) {
    log(`Error returning book: ${error.message}`, "ERROR", "API");
    console.error("Error returning book:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { returnBook };
