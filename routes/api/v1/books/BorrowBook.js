const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const { sendMail } = require("#common/Mailer.js");

/**
 * Borrow a book from the library
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;
    const { durationDays = 14 } = req.body; // Default borrowing period is 14 days

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book is available to borrow
    if (book.status !== "available") {
      return res.status(400).json({ message: `Book is not available for borrowing (current status: ${book.status})` });
    }

    // Check if there are copies available
    if (book.copies < 1) {
      return res.status(400).json({ message: "No copies of this book are available" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is allowed to borrow (membership active)
    if (user.library.membershipStatus !== "ACTIVE") {
      return res.status(403).json({ message: "Your membership is not active" });
    }

    // Check if user has outstanding fines
    if (user.library.fines > 0) {
      return res.status(403).json({ message: "You have unpaid fines" });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + durationDays);

    // Create borrow record
    user.library.borrowedBooks.push({
      book: bookId,
      borrowDate: new Date(),
      dueDate: dueDate,
      status: "BORROWED",
    });

    // Update book status
    book.copies -= 1;
    if (book.copies === 0) {
      book.status = "borrowed";
    }

    // Save changes
    await user.save();
    await book.save();

    // Send confirmation email if user has email notifications enabled
    if (user.library.notificationPreferences.emailNotifications && user.auth.email) {
      const emailContent = `
        <h2>Book Borrowed Successfully</h2>
        <p>Dear ${user.profile.firstName || user.identifier.username},</p>
        <p>You have successfully borrowed <strong>${book.title}</strong> by ${book.author}.</p>
        <p>Due date: ${dueDate.toDateString()}</p>
        <p>Please return the book before the due date to avoid late fees.</p>
        <p>Thank you for using our library!</p>
      `;

      await sendMail(user.auth.email, "Book Borrowed Confirmation", emailContent);
    }

    return res.status(200).json({
      message: "Book borrowed successfully",
      borrowRecord: user.library.borrowedBooks[user.library.borrowedBooks.length - 1],
      dueDate,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes POST /books/:bookId/borrow");
    return res.status(500).send();
  }
};

module.exports = { borrowBook };
