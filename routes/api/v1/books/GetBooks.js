const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");

const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, title, author, ISBN, publisher, genre, status, language, publicationYear, availableOnly = false, sortBy = "title", sortOrder = "asc" } = req.query;

    // Build filter object
    const filter = {};
    if (title) filter.title = { $regex: title, $options: "i" };
    if (author) filter.author = { $regex: author, $options: "i" };
    if (ISBN) filter.ISBN = { $regex: ISBN, $options: "i" };
    if (publisher) filter.publisher = { $regex: publisher, $options: "i" };
    if (genre) filter.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    if (publicationYear) filter.publicationYear = parseInt(publicationYear);
    if (language) filter.language = language;

    // Filter by status - check in the copies array
    if (status) {
      filter["copies.status"] = status;
    }

    // Filter for only available books
    if (availableOnly === "true") {
      filter.restricted = { $ne: true };
      filter["copies.status"] = "available";
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const books = await Book.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean();

    // Get user role from request
    const userRole = req.role || "USER";
    const isPrivilegedUser = userRole === "LIBRARIAN" || userRole === "ADMIN";

    // Add availability information to each book
    const processedBooks = books.map((book) => {
      const availableCopies = book.copies.filter((copy) => copy.status === "available").length;

      // Process copies based on user role
      const processedCopies = isPrivilegedUser
        ? book.copies
        : book.copies.map((copy) => {
            // if userId is the same as the authenticated user, include userId
            if (copy.userId && copy.userId.toString() === req.userId) {
              return copy;
            }
            // For USER role, exclude userId from each copy
            const { userId, ...copyWithoutUserId } = copy;
            return copyWithoutUserId;
          });

      return {
        ...book,
        copies: processedCopies,
        availableCopies,
        totalCopies: book.copies.length,
      };
    });

    // Get total count for pagination
    const total = await Book.countDocuments(filter);

    return res.status(200).json({
      data: processedBooks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getBooks };
