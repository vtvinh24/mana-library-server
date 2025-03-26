const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");

/**
 * Get books currently reserved by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReservedBooks = async (req, res) => {
  try {
    const userId = req.userId;

    // Find books where user has a reservation (a copy with reserved status and user ID)
    const books = await Book.find({
      copies: {
        $elemMatch: {
          status: "reserved",
          userId: userId,
        },
      },
    }).select("title author ISBN publisher publicationYear genre description coverImage copies");

    if (!books) {
      return res.status(404).json({ message: "No reserved books found" });
    }

    // Process the books to include only relevant information
    const reservedBooks = books.map((book) => {
      // Find the copy that this user has reserved
      const reservedCopy = book.copies.find((copy) => copy.status === "reserved" && copy.userId && copy.userId.toString() === userId);

      return {
        book: {
          _id: book._id,
          title: book.title,
          author: book.author,
          ISBN: book.ISBN,
          publisher: book.publisher,
          publicationYear: book.publicationYear,
          genre: book.genre,
          description: book.description,
          coverImage: book.coverImage,
        },
        reservedAt: reservedCopy?.updatedAt || new Date(),
        status: "ACTIVE",
      };
    });

    return res.status(200).json({
      count: reservedBooks.length,
      data: reservedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/reserved");
    return res.status(500).send();
  }
};

module.exports = { getReservedBooks };
