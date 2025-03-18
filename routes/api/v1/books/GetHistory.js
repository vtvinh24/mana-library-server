const Transaction = require("#models/Transaction.js");
const { log } = require("#common/Logger.js");
const { isMongoId } = require("#common/Validator.js");

/**
 * Get transaction history - serves both user and staff needs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHistory = async (req, res) => {
  try {
    const { role, userId } = req;
    const { page = 1, limit = 20, type, startDate, endDate, userId: requestedUserId } = req.query;

    // Build query based on permissions
    let query = {};

    // Regular users can only see their own transactions
    if (role !== "admin" && role !== "librarian") {
      query.user = userId;
    }
    // Staff can filter by specific user if requested
    else if (requestedUserId && isMongoId(requestedUserId)) {
      query.user = requestedUserId;
    }

    // Apply additional filters
    if (type) {
      query.type = type;
    }

    if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    if (endDate) {
      if (query.date) {
        query.date.$lte = new Date(endDate);
      } else {
        query.date = { $lte: new Date(endDate) };
      }
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .populate({
        path: "book",
        select: "title author isbn coverImage",
      })
      .populate({
        path: "user",
        select: "profile.firstName profile.lastName identifier.username auth.email library.cardNumber",
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    return res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      results: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        date: t.date,
        dueDate: t.dueDate,
        lateFee: t.lateFee,
        amount: t.amount,
        book: t.book
          ? {
              id: t.book._id,
              title: t.book.title,
              author: t.book.author,
              isbn: t.book.isbn,
              coverImage: t.book.coverImage,
            }
          : null,
        user: t.user
          ? {
              id: t.user._id,
              name: `${t.user.profile?.firstName || ""} ${t.user.profile?.lastName || ""}`.trim() || t.user.identifier?.username || t.user.auth?.email || "Unknown",
              cardNumber: t.user.library?.cardNumber,
            }
          : null,
      })),
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /books/history");
    return res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};

module.exports = { getHistory };
