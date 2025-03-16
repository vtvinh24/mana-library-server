const Book = require("#models/Book.js");

async function getBookById(req, res) {
  try {
    const { bookId } = req.params;

    const book = await Book.findByPk(bookId, {
      include: [{ association: "author" }, { association: "category" }, { association: "publisher" }],
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ book });
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { getBookById };
