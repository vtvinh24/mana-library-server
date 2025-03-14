const { log } = require("#common/Logger.js");
const Book = require("#models/Book.js");
const User = require("#models/User.js");
const { sendMail } = require("#common/Mailer.js");

/**
 * Return a borrowed book to the library
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const returnBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the borrow record
    const borrowIndex = user.library.borrowedBooks.findIndex((item) => item.book.toString() === bookId && item.status === "BORROWED");

    if (borrowIndex === -1) {
      return res.status(404).json({ message: "You don't have this book borrowed" });
    }

    const borrowRecord = user.library.borrowedBooks[borrowIndex];
    const today = new Date();

    // Calculate late fee if applicable (10 cents per day late)
    let lateFee = 0;
    if (today > borrowRecord.dueDate) {
      const daysLate = Math.ceil((today - borrowRecord.dueDate) / (1000 * 60 * 60 * 24));
      lateFee = daysLate * 0.1; // $0.10 per day
    }

    // Update borrow record status
    borrowRecord.status = "RETURNED";
    borrowRecord.returnedDate = today;
    user.library.borrowedBooks[borrowIndex] = borrowRecord;

    // Add fine if late
    if (lateFee > 0) {
      user.library.fines += lateFee;
    }

    // Update book status and copies count
    book.copies += 1;
    if (book.status === "borrowed") {
      book.status = "available";
    }

    // Save changes
    await user.save();
    await book.save();

    // Check for reservations
    const usersWithReservation = await User.find({
      "library.reservedBooks": {
        $elemMatch: {
          book: bookId,
          status: "ACTIVE",
        },
      },
    }).sort({ "library.reservedBooks.reservationDate": 1 });

    // Notify first user in the reservation queue if any
    if (usersWithReservation.length > 0) {
      const nextUser = usersWithReservation[0];

      if (nextUser.library.notificationPreferences.emailNotifications && nextUser.auth.email) {
        const emailContent = `
          <h2>Book Available for Pickup</h2>
          <p>Dear ${nextUser.profile.firstName || nextUser.identifier.username},</p>
          <p>Good news! The book <strong>${book.title}</strong> by ${book.author} that you reserved is now available.</p>
          <p>Please visit the library within the next 3 days to check out this book.</p>
          <p>Thank you for using our library!</p>
        `;

        await sendMail(nextUser.auth.email, "Reserved Book Available", emailContent);
      }
    }

    // Send return confirmation email
    if (user.library.notificationPreferences.emailNotifications && user.auth.email) {
      const emailContent = `
        <h2>Book Return Confirmation</h2>
        <p>Dear ${user.profile.firstName || user.identifier.username},</p>
        <p>You have successfully returned <strong>${book.title}</strong> by ${book.author}.</p>
        ${lateFee > 0 ? `<p>Late fee: $${lateFee.toFixed(2)}</p>` : "<p>Thank you for returning on time!</p>"}
        <p>Total outstanding fines: $${user.library.fines.toFixed(2)}</p>
        <p>Thank you for using our library!</p>
      `;

      await sendMail(user.auth.email, "Book Return Confirmation", emailContent);
    }

    return res.status(200).json({
      message: "Book returned successfully",
      lateFee: lateFee > 0 ? lateFee : 0,
      outstandingFines: user.library.fines,
    });
  } catch (err) {
    log(err.message, "ERROR", "routes POST /books/:bookId/return");
    return res.status(500).send();
  }
};

module.exports = { returnBook };
