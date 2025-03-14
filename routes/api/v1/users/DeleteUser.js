const User = require("#models/User.js");
const { log } = require("#common/Logger.js");

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has borrowed books
    if (user.library.borrowedBooks && user.library.borrowedBooks.some((book) => book.status === "BORROWED" || book.status === "OVERDUE")) {
      return res.status(400).json({
        message: "Cannot delete user with borrowed books. Please return all books first.",
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    log(err, "ERROR", "routes DELETE /users/:userId");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { deleteUser };
