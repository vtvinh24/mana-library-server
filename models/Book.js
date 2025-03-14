const mongoose = require("mongoose");
const baseSchema = require("./Base");

const bookSchema = new mongoose.Schema(
  {
    // The full title of the book
    // Example: "The Lord of the Rings: The Fellowship of the Ring"
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // The full name of the book's author(s)
    // Example: "J.R.R. Tolkien"
    author: {
      type: String,
      required: true,
      trim: true,
    },

    // International Standard Book Number - unique identifier for books
    // Example: "978-0-618-57494-2"
    ISBN: {
      type: String,
      unique: true,
      trim: true,
    },

    // The company/organization that published the book
    // Example: "Houghton Mifflin"
    publisher: {
      type: String,
      trim: true,
    },

    // The year when the book was published
    // Example: 1954
    publicationYear: {
      type: Number,
    },

    // Categories the book belongs to (can have multiple)
    // Example: ["Fantasy", "Adventure", "Fiction"]
    genre: {
      type: [String],
      default: [],
    },

    // A summary or synopsis of the book's content
    // Example: "A hobbit named Frodo inherits a mysterious ring..."
    description: {
      type: String,
      trim: true,
    },

    // The total number of pages in the book
    // Example: 423
    pages: {
      type: Number,
    },

    // The language the book is written in
    // Example: "English"
    language: {
      type: String,
      default: "English",
    },

    // URL or path to the book's cover image
    // Example: "/images/covers/fellowship-ring.jpg"
    coverImage: {
      type: String,
    },

    // Physical location of the book in the library
    // Example: "Floor 2, Shelf B3"
    location: {
      type: String,
      trim: true,
    },

    // Current availability status of the book
    // Example: "available", "borrowed", "reserved", "lost"
    status: {
      type: String,
      enum: ["available", "borrowed", "reserved", "lost"],
      default: "available",
    },

    // Physical condition of the book
    // Example: "new", "good", "fair", "poor"
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "good",
    },

    // Number of copies of this book owned by the library
    // Example: 3
    copies: {
      type: Number,
      min: 0,
      default: 1,
    },

    // Date when the book was added to the library collection
    // Example: 2022-05-15T00:00:00.000Z
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },

    // Purchase price or value of the book
    // Example: 24.99
    price: {
      type: Number,
      min: 0,
    },

    // Dewey Decimal Classification number for library organization
    // Example: "813.54"
    deweyDecimal: {
      type: String,
    },

    // Additional keywords to help with searching and categorization
    // Example: ["epic", "quest", "middle-earth", "ring"]
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

bookSchema.add(baseSchema);

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
