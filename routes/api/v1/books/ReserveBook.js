const { log } = require("#common/Logger.js");
const { MESSAGES } = require("#enum/Message.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");

const reserveBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    const book = await Book.findById(bookId).populate("copies.userId").lean();

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book is available for reservation
    const availableCopies = book.copies.filter((copy) => copy.status === "available");
    if (availableCopies.length === 0) {
      return res.status(400).json({ message: MESSAGES.BOOK_NOT_AVAILABLE });
    }

    // Find the first available copy
    const copy = availableCopies[0];
    copy.status = "reserved";
    copy.userId = userId;
    await Book.findByIdAndUpdate(bookId, { $set: { copies: book.copies } });
    log(`User ${userId} reserved book ${bookId}`, "INFO", "BOOK");
    return res.json({ message: "Book reserved successfully" });
  } catch (error) {
    log(error, "ERROR", "routes /api/v1/books/ReserveBook");
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { reserveBook };
