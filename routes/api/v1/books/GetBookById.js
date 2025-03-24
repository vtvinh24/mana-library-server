const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const Reservation = require("#models/Reservation.js");

/**
 * Get book details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getBookById(req, res) {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    const book = await Book.findById(bookId).lean();

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Process book data to include availability information
    const availableCopies = book.copies.filter((copy) => copy.status === "available").length;
    const borrowedCopies = book.copies.filter((copy) => copy.status === "borrowed").length;
    const reservedCopies = book.copies.filter((copy) => copy.status === "reserved").length;

    let userInteractions = {
      isBorrowed: false,
      isReserved: false,
      reservation: null,
    };

    // If user is authenticated, check if they have borrowed or reserved this book
    if (userId) {
      // Check if user has borrowed this book
      const user = await User.findById(userId);
      if (user) {
        userInteractions.isBorrowed = user.library && user.library.borrowedBooks && user.library.borrowedBooks.some((item) => item.book.toString() === bookId);

        // Check if user has reserved this book
        const reservation = await Reservation.findOne({
          user: userId,
          book: bookId,
          status: { $in: ["pending", "ready"] },
        });

        if (reservation) {
          userInteractions.isReserved = true;
          userInteractions.reservation = {
            id: reservation._id,
            status: reservation.status,
            createdAt: reservation.createdAt,
            expiresAt: reservation.expiresAt,
          };
        }
      }
    }

    // Combine book data with availability information
    const bookData = {
      ...book,
      availability: {
        available: availableCopies,
        borrowed: borrowedCopies,
        reserved: reservedCopies,
        total: book.copies.length,
        isAvailable: !book.restricted && availableCopies > 0,
      },
      userInteractions,
    };

    return res.status(200).json(bookData);
  } catch (error) {
    log(`Error fetching book by ID: ${error.message}`, "ERROR", "API");
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { getBookById };
