const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const { isMongoId } = require("#common/Validator.js");
const mongoose = require("mongoose");

/**
 * Get books borrowed by a specific user (admin/librarian only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBorrowedBooksByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isMongoId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // First verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    let borrowedBooks = books
      .map((book) => {
        // Find copies borrowed by this user
        const userCopies = book.copies.filter(
          (copy) => copy.status === "borrowed" && copy.userId && copy.userId.equals(objectId) // Use MongoDB's equals method for proper ObjectId comparison
        );

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

    // Get query parameters for filtering
    const { status, startDate, endDate } = req.query;

    // Apply filters if needed
    if (startDate) {
      const start = new Date(startDate);
      borrowedBooks = borrowedBooks.filter((item) => new Date(item.borrowedAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      borrowedBooks = borrowedBooks.filter((item) => new Date(item.borrowedAt) <= end);
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.identifier?.username,
        name: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ""}` : undefined,
      },
      count: borrowedBooks.length,
      data: borrowedBooks,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/borrowed/:userId");
    return res.status(500).send();
  }
};

module.exports = { getBorrowedBooksByUser };
