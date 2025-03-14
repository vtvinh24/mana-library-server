const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const { isISBN } = require("#common/Validator.js");

/**
 * Create a new book in the library
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBook = async (req, res) => {
  try {
    const { title, author, ISBN, publisher, publicationYear, genre, description, pages, language, coverImage, location, condition, copies, price, deweyDecimal, tags } = req.body;

    // Validate required fields
    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    // Validate ISBN if provided
    if (ISBN && !isISBN(ISBN)) {
      return res.status(400).json({ message: "Invalid ISBN format" });
    }

    // Check for duplicate ISBN
    if (ISBN) {
      const existingBook = await Book.findOne({ ISBN });
      if (existingBook) {
        return res.status(409).json({ message: "Book with this ISBN already exists" });
      }
    }

    const book = new Book({
      title,
      author,
      ISBN,
      publisher,
      publicationYear,
      genre: Array.isArray(genre) ? genre : genre ? [genre] : [],
      description,
      pages,
      language,
      coverImage,
      location,
      condition,
      copies: copies || 1,
      price,
      deweyDecimal,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      createdBy: req.userId,
    });

    await book.save();

    return res.status(201).json(book);
  } catch (err) {
    log(err.message, "ERROR", "routes POST /books");
    return res.status(500).send();
  }
};

module.exports = { createBook };
