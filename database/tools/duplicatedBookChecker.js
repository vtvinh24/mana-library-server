const fs = require("fs");
const path = require("path");

// Path to books.json file
const booksFilePath = path.join(__dirname, "..", "data", "books.json");

// Read the books data
const booksData = JSON.parse(fs.readFileSync(booksFilePath, "utf8"));

// Find duplicates by ISBN
console.log("Checking for duplicate ISBNs...");
const isbnMap = new Map();
const isbnDuplicates = [];

booksData.forEach((book, index) => {
  console.log(book.title);
  if (book.ISBN) {
    if (isbnMap.has(book.ISBN)) {
      isbnDuplicates.push({
        isbn: book.ISBN,
        firstBook: {
          index: isbnMap.get(book.ISBN),
          title: booksData[isbnMap.get(book.ISBN)].title,
          author: booksData[isbnMap.get(book.ISBN)].author,
        },
        secondBook: {
          index,
          title: book.title,
          author: book.author,
        },
      });
    } else {
      isbnMap.set(book.ISBN, index);
    }
  }
});

// Find potential duplicates by title and author
console.log("Checking for potential duplicates by title and author...");
const titleAuthorMap = new Map();
const titleAuthorDuplicates = [];

booksData.forEach((book, index) => {
  const key = `${book.title}|${book.author}`.toLowerCase();
  if (titleAuthorMap.has(key)) {
    // Only count as duplicate if ISBN is different (otherwise it would be caught by the ISBN check)
    const prevBook = booksData[titleAuthorMap.get(key)];
    if (prevBook.ISBN !== book.ISBN) {
      titleAuthorDuplicates.push({
        key,
        firstBook: {
          index: titleAuthorMap.get(key),
          isbn: prevBook.ISBN,
          title: prevBook.title,
          author: prevBook.author,
        },
        secondBook: {
          index,
          isbn: book.ISBN,
          title: book.title,
          author: book.author,
        },
      });
    }
  } else {
    titleAuthorMap.set(key, index);
  }
});

// Display results
console.log("\n===== RESULTS =====");

if (isbnDuplicates.length === 0) {
  console.log("No duplicate ISBNs found.");
} else {
  console.log(`Found ${isbnDuplicates.length} duplicate ISBNs:`);
  isbnDuplicates.forEach((dup, i) => {
    console.log(`\n${i + 1}. ISBN: ${dup.isbn}`);
    console.log(`   First occurrence: [${dup.firstBook.index}] "${dup.firstBook.title}" by ${dup.firstBook.author}`);
    console.log(`   Second occurrence: [${dup.secondBook.index}] "${dup.secondBook.title}" by ${dup.secondBook.author}`);
  });
}

if (titleAuthorDuplicates.length === 0) {
  console.log("\nNo potential duplicates by title and author found.");
} else {
  console.log(`\nFound ${titleAuthorDuplicates.length} potential duplicates by title and author:`);
  titleAuthorDuplicates.forEach((dup, i) => {
    console.log(`\n${i + 1}. "${dup.firstBook.title}" by ${dup.firstBook.author}`);
    console.log(`   First occurrence: [${dup.firstBook.index}] ISBN: ${dup.firstBook.isbn || "N/A"}`);
    console.log(`   Second occurrence: [${dup.secondBook.index}] ISBN: ${dup.secondBook.isbn || "N/A"}`);
  });
}
