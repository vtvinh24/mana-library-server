const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");

/**
 * Search for books using various criteria
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchBooks = async (req, res) => {
  try {
    const { q, page = 1, limit = 10, sortBy = "title", sortOrder = "asc" } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Search in multiple fields with text index or regex
    const books = await Book.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { publisher: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { ISBN: { $regex: q, $options: "i" } },
        { tags: { $in: [q] } },
        { genre: { $in: [q] } },
      ],
    })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Book.countDocuments({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { publisher: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { ISBN: { $regex: q, $options: "i" } },
        { tags: { $in: [q] } },
        { genre: { $in: [q] } },
      ],
    });

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
    log(err.message, "ERROR", "routes GET /books/search");
    return res.status(500).send();
  }
};

module.exports = { searchBooks };
