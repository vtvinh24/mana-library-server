const Book = require("#models/Book.js");

async function exportBooks(req, res) {
  try {
    const books = await Book.findAll({
      include: [{ association: "author" }, { association: "category" }, { association: "publisher" }],
    });

    const exportedBooks = books.map((book) => {
      const plainBook = book.get({ plain: true });

      // Reshape data for export
      return {
        title: plainBook.title,
        isbn: plainBook.isbn,
        publicationYear: plainBook.publicationYear,
        description: plainBook.description,
        author: plainBook.author?.name,
        category: plainBook.category?.name,
        publisher: plainBook.publisher?.name,
        copies: plainBook.copies,
        coverImage: plainBook.coverImage,
        language: plainBook.language,
      };
    });

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=library-catalog.json");

    return res.json(exportedBooks);
  } catch (error) {
    console.error("Error exporting books:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { exportBooks };
