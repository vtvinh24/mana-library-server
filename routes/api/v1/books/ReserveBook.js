const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Reservation = require("#models/Reservation.js");
const { startSession } = require("mongoose");

const reserveBook = async (req, res) => {
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

    // Check if user has unpaid fines
    if (user.library.fines > 0) {
      return res.status(403).json({
        message: "You have unpaid fines",
        amount: user.library.fines,
        redirectTo: "/pay-fines",
      });
    }

    // Check if user already borrowed this book
    const alreadyBorrowed = user.library.borrowed.some((item) => item.book.toString() === bookId);

    if (alreadyBorrowed) {
      return res.status(400).json({ message: "You already have this book" });
    }

    // Check if user already reserved this book
    const existingReservation = await Reservation.findOne({
      user: userId,
      book: bookId,
      status: { $in: ["pending", "ready"] },
    }).session(session);

    if (existingReservation) {
      return res.status(400).json({ message: "You already have a reservation for this book" });
    }

    // Check reservation limit
    const activeReservations = await Reservation.countDocuments({
      user: userId,
      status: { $in: ["pending", "ready"] },
    }).session(session);

    const reservationLimit = user.library.membershipTier === "premium" ? 5 : 3;
    if (activeReservations >= reservationLimit) {
      return res.status(403).json({ message: "You have reached your reservation limit" });
    }

    // Create reservation with expiry
    const expiryDays = 3; // Reservations expire after 3 days once ready
    const reservation = new Reservation({
      user: userId,
      book: bookId,
      status: book.status === "available" ? "ready" : "pending",
      createdAt: new Date(),
      notifiedAt: book.status === "available" ? new Date() : null,
      expiresAt: book.status === "available" ? new Date(new Date().getTime() + expiryDays * 24 * 60 * 60 * 1000) : null,
    });

    // If book is available, mark it as reserved
    if (book.status === "available") {
      book.status = "reserved";
      await book.save({ session });
    }

    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Schedule expiration check task (in a production app, this would be handled by a job scheduler)
    if (reservation.status === "ready") {
      setTimeout(async () => {
        try {
          const expiredReservation = await Reservation.findById(reservation._id);
          if (expiredReservation && expiredReservation.status === "ready") {
            expiredReservation.status = "expired";
            await expiredReservation.save();

            // Check if book needs status update
            const book = await Book.findById(bookId);
            const pendingReservations = await Reservation.find({
              book: bookId,
              status: "pending",
            }).sort({ createdAt: 1 });

            if (pendingReservations.length > 0) {
              // Update next reservation to ready
              const nextReservation = pendingReservations[0];
              nextReservation.status = "ready";
              nextReservation.notifiedAt = new Date();
              nextReservation.expiresAt = new Date(new Date().getTime() + expiryDays * 24 * 60 * 60 * 1000);
              await nextReservation.save();
            } else if (book.status === "reserved") {
              // No more reservations, mark as available
              book.status = "available";
              await book.save();
            }
          }
        } catch (error) {
          console.error("Error processing reservation expiration:", error);
        }
      }, expiryDays * 24 * 60 * 60 * 1000);
    }

    return res.status(201).json({
      message: `Book ${reservation.status === "ready" ? "ready for pickup" : "reserved successfully"}`,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error reserving book:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { reserveBook };
