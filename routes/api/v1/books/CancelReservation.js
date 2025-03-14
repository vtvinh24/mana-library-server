const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");

/**
 * Cancel a book reservation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelReservation = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the reservation
    const reservationIndex = user.library.reservedBooks.findIndex((item) => item.book.toString() === bookId && item.status === "ACTIVE");

    if (reservationIndex === -1) {
      return res.status(404).json({ message: "No active reservation found for this book" });
    }

    // Update reservation status
    user.library.reservedBooks[reservationIndex].status = "FULFILLED";

    // Check if there are other active reservations for this book
    const otherReservations = await User.countDocuments({
      "library.reservedBooks": {
        $elemMatch: {
          book: bookId,
          status: "ACTIVE",
        },
      },
      "_id": { $ne: userId },
    });

    // If no other reservations, update book status
    if (otherReservations === 0 && book.status === "reserved") {
      book.status = "available";
    }

    // Save changes
    await user.save();
    if (otherReservations === 0) {
      await book.save();
    }

    return res.status(200).json({
      message: "Reservation cancelled successfully",
    });
  } catch (err) {
    log(err.message, "ERROR", "routes POST /books/:bookId/cancel-reservation");
    return res.status(500).send();
  }
};

module.exports = { cancelReservation };
