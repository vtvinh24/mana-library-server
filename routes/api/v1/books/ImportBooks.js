const Book = require("#models/Book.js");
const { log } = require("#common/Logger.js");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Middleware to handle file upload
const handleFileUpload = upload.single("booksFile");

async function importBooks(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read uploaded JSON file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, "utf8");
    const booksData = JSON.parse(fileContent);

    // Cleanup temp file after reading
    fs.unlinkSync(filePath);

    if (!Array.isArray(booksData)) {
      return res.status(400).json({ message: "Invalid file format. Expected array of books." });
    }

    let imported = 0;
    let errors = [];

    // Process each book in the JSON array
    for (const bookData of booksData) {
      try {
        // Check for duplicate ISBN if provided
        if (bookData.ISBN) {
          const existingBook = await Book.findOne({ ISBN: bookData.ISBN });
          if (existingBook) {
            errors.push({
              book: bookData.title || "Unknown",
              error: `Book with ISBN ${bookData.ISBN} already exists`,
            });
            continue;
          }
        }

        // Create book directly with MongoDB document structure
        await Book.create({
          title: bookData.title,
          author: bookData.author,
          ISBN: bookData.ISBN,
          publisher: bookData.publisher,
          publicationYear: bookData.publicationYear,
          genre: Array.isArray(bookData.genre) ? bookData.genre : bookData.genre ? [bookData.genre] : [],
          description: bookData.description,
          pages: bookData.pages,
          language: bookData.language || "English",
          coverImage: bookData.coverImage,
          location: bookData.location,
          condition: bookData.condition || "good",
          copies: bookData.copies || 1,
          price: bookData.price,
          deweyDecimal: bookData.deweyDecimal,
          tags: Array.isArray(bookData.tags) ? bookData.tags : bookData.tags ? [bookData.tags] : [],
          createdBy: req.userId,
        });

        imported++;
      } catch (bookError) {
        errors.push({
          book: bookData.title || "Unknown",
          error: bookError.message,
        });
      }
    }

    return res.status(200).json({
      message: `Imported ${imported} books successfully`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log(error.message, "ERROR", "routes POST /books/import");
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { importBooks, handleFileUpload };
