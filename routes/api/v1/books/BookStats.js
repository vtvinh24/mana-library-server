const Book = require("#models/Book.js");
const User = require("#models/User.js");
const { log } = require("#common/Logger.js");

async function getBookStats(req, res) {
  try {
    // Get total counts using Mongoose
    const totalBooks = await Book.countDocuments();
    const borrowedBooks = await Book.countDocuments({ status: "BORROWED" });
    const reservedBooks = await Book.countDocuments({ status: "RESERVED" });

    // Aggregate to find most borrowed books
    const mostBorrowedBooks = await User.aggregate([
      { $unwind: "$library.borrowedBooks" },
      {
        $group: {
          _id: "$library.borrowedBooks.book",
          borrowCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      {
        $project: {
          _id: 0,
          bookId: "$_id",
          title: "$bookDetails.title",
          author: "$bookDetails.author",
          borrowCount: 1,
        },
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 },
    ]);

    // Aggregate to find most reserved books
    const mostReservedBooks = await User.aggregate([
      { $unwind: "$library.reservedBooks" },
      {
        $match: { "library.reservedBooks.status": "ACTIVE" },
      },
      {
        $group: {
          _id: "$library.reservedBooks.book",
          reserveCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "bookDetails",
        },
      },
      { $unwind: "$bookDetails" },
      {
        $project: {
          _id: 0,
          bookId: "$_id",
          title: "$bookDetails.title",
          author: "$bookDetails.author",
          reserveCount: 1,
        },
      },
      { $sort: { reserveCount: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      stats: {
        totalBooks,
        borrowedBooks,
        reservedBooks,
        availability: {
          percent: totalBooks > 0 ? ((totalBooks - borrowedBooks) / totalBooks) * 100 : 0,
          available: totalBooks - borrowedBooks,
        },
      },
      mostBorrowedBooks,
      mostReservedBooks,
    });
  } catch (error) {
    log(error.message, "ERROR", "routes GET /books/stats");
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { getBookStats };
