const mongoose = require("mongoose");
const baseSchema = require("./Base");

const copySchema = new mongoose.Schema(
  {
    // The physical condition of the book copy
    // Example: "good", "fair", "poor"
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "good",
    },

    // The current availability status of the book copy
    // Example: "available", "borrowed", "reserved", "lost"
    status: {
      type: String,
      enum: ["available", "borrowed", "reserved", "lost"],
      default: "available",
    },

    // The date when the book copy was borrowed or reserved
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

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
      type: String,
    },

    // Number of copies of this book owned by the library
    // Example: 3
    copies: {
      type: [copySchema],
      default: [],
    },

    // Additional keywords to help with searching and categorization
    // Example: ["epic", "quest", "middle-earth", "ring"]
    tags: {
      type: [String],
      default: [],
    },

    // If true, not available for borrowing
    restricted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

bookSchema.add(baseSchema);

bookSchema.virtual("isAvailable").get(function () {
  if (this.restricted) {
    return false;
  }
  return this.copies.some((copy) => copy.status === "available");
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
