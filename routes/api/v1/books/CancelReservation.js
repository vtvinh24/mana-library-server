const Book = require("#models/Book.js");
const Reservation = require("#models/Reservation.js");
const { startSession } = require("mongoose");

const cancelReservation = async (req, res) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const { userId, reservationId } = req.body;

    if (!userId || !reservationId) {
      return res.status(400).json({ message: "User ID and Reservation ID are required" });
    }

    // Find reservation with session
    const reservation = await Reservation.findById(reservationId).session(session);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Verify user owns this reservation
    if (reservation.user.toString() !== userId) {
      return res.status(403).json({ message: "This is not your reservation" });
    }

    // Can only cancel active reservations
    if (!["pending", "ready"].includes(reservation.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${reservation.status} reservation` });
    }

    const bookId = reservation.book;
    const book = await Book.findById(bookId).session(session);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Mark reservation as cancelled
    reservation.status = "cancelled";
    await reservation.save({ session });

    // Check if there are other active reservations for this book
    const otherReservations = await Reservation.find({
      book: bookId,
      status: { $in: ["pending", "ready"] },
      _id: { $ne: reservationId },
    })
      .sort({ createdAt: 1 })
      .session(session);

    // Update book status or next reservation
    if (reservation.status === "ready") {
      // This was the active reservation
      if (otherReservations.length > 0) {
        // There are other reservations, update the next one to ready
        const nextReservation = otherReservations[0];
        nextReservation.status = "ready";
        nextReservation.notifiedAt = new Date();
        nextReservation.expiresAt = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        await nextReservation.save({ session });
        // Book status remains "reserved"
      } else {
        // No more reservations and the book is not borrowed
        if (book.status !== "borrowed") {
          book.status = "available";
          await book.save({ session });
        }
      }
    } else if (otherReservations.length === 0 && book.status === "reserved" && book.status !== "borrowed") {
      // This was a pending reservation, but there are no more reservations and book is not currently borrowed
      book.status = "available";
      await book.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling reservation:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { cancelReservation };
