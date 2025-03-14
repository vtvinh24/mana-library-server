const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");

/**
 * Reserve a book from the library
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const reserveBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book is available to reserve
    if (book.status !== "available") {
      return res.status(400).json({ message: `Book is not available for reservation (current status: ${book.status})` });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has this book reserved
    const existingReservation = user.library.reservedBooks.find((item) => item.book.toString() === bookId && item.status === "ACTIVE");

    if (existingReservation) {
      return res.status(400).json({ message: "You already have this book reserved" });
    }

    // Add book to user's reserved books
    user.library.reservedBooks.push({
      book: bookId,
      reservationDate: new Date(),
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: "ACTIVE",
    });

    // Update book status
    book.status = "reserved";

    // Save changes
    await Promise.all([user.save(), book.save()]);

    // Send email notification
    try {
      await sendMail({
        to: user.email,
        subject: "Book Reservation Confirmation",
        text: `You have successfully reserved "${book.title}" by ${book.author}. Please pick it up within 3 days.`,
        html: `<p>You have successfully reserved "<strong>${book.title}</strong>" by ${book.author}.</p>
               <p>Please pick it up within <strong>3 days</strong>.</p>`,
      });
    } catch (emailError) {
      log(`Failed to send reservation email: ${emailError.message}`, "ERROR", "routes POST /books/:bookId/reserve");
      // Continue execution even if email fails
    }

    return res.status(201).json({
      message: "Book reserved successfully",
      reservation: {
        book: {
          id: book._id,
          title: book.title,
          author: book.author,
          coverImage: book.coverImage,
        },
        reservationDate: user.library.reservedBooks[user.library.reservedBooks.length - 1].reservationDate,
        expirationDate: user.library.reservedBooks[user.library.reservedBooks.length - 1].expirationDate,
      },
    });
  } catch (err) {
    log(err.message, "ERROR", "routes POST /books/:bookId/reserve");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { reserveBook };
