const mongoose = require("mongoose");
const baseSchema = require("./Base");

const bookCopySchema = new mongoose.Schema({
  // Unique identifier for this specific copy
  copyId: {
    type: String,
    required: true,
  },

  // Physical condition of this specific copy
  // Example: "new", "good", "fair", "poor"
  condition: {
    type: String,
    enum: ["new", "good", "fair", "poor"],
    default: "good",
  },

  // Current availability status of this specific copy
  // Example: "available", "borrowed", "reserved", "lost"
  status: {
    type: String,
    enum: ["available", "borrowed", "reserved", "lost"],
    default: "available",
  },

  // Physical location of this specific copy in the library
  // Example: "Floor 2, Shelf B3"
  location: {
    type: String,
    trim: true,
  },

  // Additional notes specific to this copy (optional)
  notes: {
    type: String,
    trim: true,
  },
});

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
    // Somehow some ISBNs in Vietname are not registered
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    // More images, videos, ...
    additionalMedia: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
      },
    ],

    // Array of individual book copies with their conditions and status
    copies: {
      type: [bookCopySchema],
      default: [],
    },

    // Total number of copies (derived from copies array length)
    totalCopies: {
      type: Number,
      default: 0,
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
