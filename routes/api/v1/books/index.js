const express = require("express");
const router = express.Router();

const { ROLE } = require("#enum/Role.js");
const { requireRoles, requireAuth } = require("#middlewares/JWT.js");

// Routes
// CRUD
const { getBooks } = require("./GetBooks");
router.get("/", getBooks);

const { createBook } = require("./CreateBook");
router.post("/", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), createBook);

const { deleteBook } = require("./DeleteBook");
router.delete("/:bookId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), deleteBook);

const { updateBook } = require("./UpdateBook");
router.patch("/:bookId", requireRoles([ROLE.ADMIN, ROLE.LIBRARIAN]), updateBook);

// Search
const { searchBooks } = require("./SearchBooks");
router.get("/search", searchBooks);

// Borrow
const { borrowBook } = require("./BorrowBook");
router.post("/:bookId/borrow", requireAuth, borrowBook);

// Return
const { returnBook } = require("./ReturnBook");
router.post("/:bookId/return", requireAuth, returnBook);

// Reserve
const { reserveBook } = require("./ReserveBook");
router.post("/:bookId/reserve", requireAuth, reserveBook);

// Cancel Reservation
const { cancelReservation } = require("./CancelReservation");
router.post("/:bookId/cancel-reservation", requireAuth, cancelReservation);

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

module.exports = router;
