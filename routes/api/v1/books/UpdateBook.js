const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const { isISBN } = require("#common/Validator.js");

/**
 * Update an existing book
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const { title, author, ISBN, publisher, publicationYear, genre, description, pages, language, coverImage, location, condition, status, copies, price, deweyDecimal, tags } = req.body;

    // Validate ISBN if it's being updated
    if (ISBN && ISBN !== book.ISBN) {
      if (!isISBN(ISBN)) {
        return res.status(400).json({ message: "Invalid ISBN format" });
      }

      // Check for duplicate ISBN
      const existingBook = await Book.findOne({ ISBN });
      if (existingBook && existingBook._id.toString() !== bookId) {
        return res.status(409).json({ message: "Book with this ISBN already exists" });
      }
    }

    // Update fields if provided
    if (title) book.title = title;
    if (author) book.author = author;
    if (ISBN) book.ISBN = ISBN;
    if (publisher) book.publisher = publisher;
    if (publicationYear) book.publicationYear = publicationYear;
    if (genre) book.genre = Array.isArray(genre) ? genre : [genre];
    if (description) book.description = description;
    if (pages) book.pages = pages;
    if (language) book.language = language;
    if (coverImage) {
      if (mongoose.Types.ObjectId.isValid(coverImage)) {
        // It's a Media ID
        book.coverImage = coverImage;
      } else if (typeof coverImage === "string" && coverImage.startsWith("http")) {
        // It's a URL, create new Media
        try {
          const media = await createMediaFromUrl(coverImage, `${book.title} - Cover Image`, req.userId, book.tags);
          book.coverImage = media._id;
        } catch (mediaError) {
          log(`Error creating cover image: ${mediaError.message}`, "ERROR", "UPDATE");
          // Continue with update even if cover image fails
        }
      }
    }
    if (location) book.location = location;
    if (condition) book.condition = condition;
    if (status) book.status = status;
    if (copies) book.copies = copies;
    if (price) book.price = price;
    if (deweyDecimal) book.deweyDecimal = deweyDecimal;
    if (tags) book.tags = Array.isArray(tags) ? tags : [tags];

    book.updatedBy = req.userId;

    await book.save();

    return res.status(200).json(book);
  } catch (err) {
    log(err.message, "ERROR", "routes PATCH /books/:bookId");
    return res.status(500).send();
  }
};

module.exports = { updateBook };
