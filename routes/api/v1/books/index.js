const express = require("express");
const router = express.Router();

const { ROLE } = require("#enum/Role.js");
const { requireRoles, requireAuth } = require("#middlewares/JWT.js");

// Routes
// CRUD - list all
const { getBooks } = require("./GetBooks");
router.get("/", getBooks);

const { createBook } = require("./CreateBook");
router.post("/", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), createBook);

// Search - must be before parameterized routes to avoid conflicts
const { searchBooks } = require("./SearchBooks");
router.get("/search", searchBooks);

// History - must be before /:bookId route
const { getHistory } = require("./GetHistory");
router.get("/history", requireAuth, getHistory);

// BORROWED and RESERVED routes - must be before /:bookId route
// Get Borrowed Books
const { getBorrowedBooks } = require("./GetBorrowedBooks");
router.get("/borrowed", requireAuth, getBorrowedBooks);

// Get Reserved Books
const { getReservedBooks } = require("./GetReservedBooks");
router.get("/reserved", requireAuth, getReservedBooks);

// Get Borrowed Books by User
const { getBorrowedBooksByUser } = require("./GetBorrowedBooksByUser");
router.get("/borrowed/:userId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), getBorrowedBooksByUser);

// Get Reserved Books by User
const { getReservedBooksByUser } = require("./GetReservedBooksByUser");
router.get("/reserved/:userId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), getReservedBooksByUser);

// Statistics - Admin only
const { getBookStats } = require("./BookStats");
router.get("/stats", requireRoles([ROLE.ADMIN]), getBookStats);

// Import/Export books
const { importBooks, handleFileUpload } = require("./ImportBooks");
router.post("/import", requireRoles([ROLE.ADMIN]), handleFileUpload, importBooks);

const { exportBooks } = require("./ExportBooks");
router.get("/export", requireRoles([ROLE.ADMIN]), exportBooks);

// INDIVIDUAL BOOK ROUTE - must come after all specific routes to avoid conflicts
const { getBookById } = require("./GetBookById");
router.get("/:bookId", getBookById);

// CRUD operations on specific book
const { deleteBook } = require("./DeleteBook");
router.delete("/:bookId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), deleteBook);

const { updateBook } = require("./UpdateBook");
router.patch("/:bookId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), updateBook);

// Borrow
const { borrowBook } = require("./BorrowBook");
router.post("/:bookId/borrow", requireAuth, borrowBook);

// Return
const { returnBook } = require("./ReturnBook");
router.post("/:bookId/return", requireAuth, returnBook);

// Reserve
const { reserveBook } = require("./ReserveBook");
router.post("/:bookId/reserve", requireAuth, reserveBook);

// Cancel Reservation - changed from POST to DELETE for RESTful consistency
const { cancelReservation } = require("./CancelReservation");
router.delete("/:bookId/reservation", requireAuth, cancelReservation);

module.exports = router;
