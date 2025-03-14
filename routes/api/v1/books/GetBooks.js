const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");

/**
 * Get all books with filtering, pagination and sorting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, title, author, genre, status, language, sortBy = "title", sortOrder = "asc" } = req.query;

    // Build filter object
    const filter = {};
    if (title) filter.title = { $regex: title, $options: "i" };
    if (author) filter.author = { $regex: author, $options: "i" };
    if (genre) filter.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    if (status) filter.status = status;
    if (language) filter.language = language;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const books = await Book.find(filter).sort(sort).skip(skip).limit(Number(limit));

    // Get total count for pagination
    const total = await Book.countDocuments(filter);

    return res.status(200).json({
      data: books,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books");
    return res.status(500).send();
  }
};

module.exports = { getBooks };
