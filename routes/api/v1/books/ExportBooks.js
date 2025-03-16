const Book = require("#models/Book.js");
const { log } = require("#common/Logger.js");

/**
 * Export books in JSON format with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function exportBooks(req, res) {
  try {
    // Apply filters from query params
    const filter = {};
    if (req.query.genre) filter.genre = { $in: [req.query.genre] };
    if (req.query.author) filter.author = { $regex: req.query.author, $options: "i" };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.language) filter.language = req.query.language;
    if (req.query.publicationYear) filter.publicationYear = req.query.publicationYear;

    // Get books with filters using mongoose find() method
    const books = await Book.find(filter).lean();

    // Process books for export, removing sensitive or unnecessary fields
    const exportData = books.map((book) => ({
      title: book.title,
      author: book.author,
      ISBN: book.ISBN,
      publisher: book.publisher,
      publicationYear: book.publicationYear,
      genre: book.genre,
      description: book.description,
      pages: book.pages,
      language: book.language,
      coverImage: book.coverImage,
      location: book.location,
      deweyDecimal: book.deweyDecimal,
      tags: book.tags,
    }));

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=library-catalog.json");

    log(`Exported ${books.length} books`, "INFO", "EXPORT");
    return res.status(200).json(exportData);
  } catch (error) {
    log(`Error exporting books: ${error.message}`, "ERROR", "EXPORT");
    return res.status(500).json({ message: "Failed to export books" });
  }
}

module.exports = { exportBooks };
