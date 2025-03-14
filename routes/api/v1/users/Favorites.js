const User = require("#models/User.js");
const Book = require("#models/Book.js");
const { log } = require("#common/Logger.js");

/**
 * Get user's favorite books
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).populate({
      path: "favorites",
      select: "title author coverImage isbn status",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ favorites: user.favorites || [] });
  } catch (error) {
    log(`Error fetching favorites: ${error.message}`, "ERROR", "USER");
    return res.status(500).json({ message: "Failed to fetch favorite books" });
  }
};

/**
 * Add book to favorites
 */
const addFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    // Validate book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Add to favorites if not already added
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if already in favorites
    if (user.favorites.includes(bookId)) {
      return res.status(400).json({ message: "Book already in favorites" });
    }

    // Add to favorites and save
    user.favorites.push(bookId);
    await user.save();

    return res.status(200).json({ message: "Book added to favorites" });
  } catch (error) {
    log(`Error adding to favorites: ${error.message}`, "ERROR", "USER");
    return res.status(500).json({ message: "Failed to add book to favorites" });
  }
};

/**
 * Remove book from favorites
 */
const removeFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    // Remove from favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if book is in favorites
    if (!user.favorites || !user.favorites.includes(bookId)) {
      return res.status(400).json({ message: "Book not in favorites" });
    }

    // Remove from favorites and save
    user.favorites = user.favorites.filter((id) => id.toString() !== bookId);
    await user.save();

    return res.status(200).json({ message: "Book removed from favorites" });
  } catch (error) {
    log(`Error removing from favorites: ${error.message}`, "ERROR", "USER");
    return res.status(500).json({ message: "Failed to remove book from favorites" });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };
