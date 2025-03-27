const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const mongoose = require("mongoose");

/**
 * Get books currently borrowed by the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBorrowedBooks = async (req, res) => {
  try {
    const userId = req.userId;
    const objectId = new mongoose.Types.ObjectId(userId);

    // Find books with at least one copy borrowed by this user
    const books = await Book.find({
      copies: {
        $elemMatch: {
          status: "borrowed",
          userId: objectId,
        },
      },
    }).select("title author ISBN publisher publicationYear genre description coverImage copies");

    // Format the response data to include copy information
    const borrowedBooks = books
      .map((book) => {
        // Find copies borrowed by this user
        const userCopies = book.copies.filter((copy) => copy.status === "borrowed" && copy.userId && copy.userId.equals(objectId));

        return userCopies.map((copy) => ({
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
          borrowedAt: copy.updatedAt || new Date(),
          dueDate: copy.dueDate,
          status: "BORROWED",
          copyId: copy._id,
          condition: copy.condition,
          note: copy.note,
        }));
      })
      .flat();

    return res.status(200).json({
      count: borrowedBooks.length,
      data: borrowedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/borrowed");
    return res.status(500).send();
  }
};

module.exports = { getBorrowedBooks };
