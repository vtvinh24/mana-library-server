const User = require("#models/User.js");

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find user with populated borrowed books
    const user = await User.findById(userId).populate({
      path: "library.borrowed.book",
      select: "title author coverImage isbn",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's active reservations
    const Reservation = require("../models/Reservation");
    const reservations = await Reservation.find({
      user: userId,
      status: { $in: ["pending", "ready"] },
    }).populate("book", "title author coverImage isbn");

    // Format response to exclude sensitive information
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      library: {
        membershipTier: user.library.membershipTier,
        fines: user.library.fines,
        borrowed: user.library.borrowed.map((item) => ({
          book: {
            _id: item.book._id,
            title: item.book.title,
            author: item.book.author,
            coverImage: item.book.coverImage,
            isbn: item.book.isbn,
          },
          borrowDate: item.borrowDate,
          dueDate: item.dueDate,
          daysRemaining: Math.ceil((new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24)),
        })),
      },
      reservations: reservations.map((r) => ({
        _id: r._id,
        book: {
          _id: r.book._id,
          title: r.book.title,
          author: r.book.author,
          coverImage: r.book.coverImage,
          isbn: r.book.isbn,
        },
        status: r.status,
        createdAt: r.createdAt,
        notifiedAt: r.notifiedAt,
        expiresAt: r.expiresAt,
      })),
    };

    return res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getUserById };
