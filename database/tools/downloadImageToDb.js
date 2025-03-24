const mongoose = require("mongoose");
const Book = require("#models/Book.js");
const Media = require("#models/Media.js");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const { createDirectory } = require("#common/File.js");
const Env = require("#config/Env.js");
const Mongoose = require("#common/Mongoose.js");

async function convertCoverImages() {
  try {
    // Connect to database - use the Mongoose instance directly

    // Find books with URL string cover images
    const books = await Book.find({
      coverImage: { $type: "string" },
    });

    // Filter for URL strings in memory
    const booksWithUrls = books.filter((book) => book.coverImage && (book.coverImage.startsWith("http://") || book.coverImage.startsWith("https://")));

    console.log(`Found ${booksWithUrls.length} books with URL cover images to convert`);

    // Process each book
    for (const book of books) {
      console.log(JSON.stringify(book));
      try {
        const coverUrl = book.coverImage;

        // Skip if not a URL
        if (!coverUrl || !coverUrl.startsWith("http")) {
          console.log(`Skipping book ${book.title}: No valid cover URL`);
          continue;
        }

        console.log(`Converting cover for "${book.title}"`);

        // Format Unsplash URL properly if needed
        let formattedUrl = coverUrl;
        if (coverUrl.includes("unsplash.com") && !coverUrl.includes("?")) {
          // Add parameters for Unsplash API if missing
          formattedUrl = `${coverUrl}?fm=jpg&w=800&fit=max`;
        }

        // Create media document
        const media = await createMediaFromUrl(formattedUrl, `${book.title} - Cover Image`, book.createdBy || null, book.tags || []);

        // Update book with media reference
        book.coverImage = media._id;
        await book.save();

        console.log(`Successfully converted cover for "${book.title}"`);
      } catch (error) {
        console.error(`Error converting cover for book "${book.title}": ${error.message}`);
      }
    }

    console.log("Conversion complete");
    process.exit(0);
  } catch (error) {
    console.error(`Error in conversion script: ${error.message}`);
    process.exit(1);
  }
}

async function createMediaFromUrl(url, name, userId, tags = []) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "media");
    await createDirectory(uploadsDir);

    // Download image with retry logic
    let response;
    try {
      response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 10000, // 10 second timeout
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (Node.js Book Library App)",
        },
      });
    } catch (axiosError) {
      console.error(`Failed to download image from ${url}: ${axiosError.message}`);
      throw new Error(`Image download failed: ${axiosError.message}`);
    }

    const buffer = Buffer.from(response.data);

    // Process image with sharp
    const processedImage = await sharp(buffer).resize(800, null, { withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();

    // Generate unique filename
    const filename = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    // Save to disk
    await fs.writeFile(filePath, processedImage);

    // Create media document
    const media = new Media({
      name: name,
      filename: filename,
      path: `/uploads/media/${filename}`,
      mimetype: "image/jpeg",
      size: processedImage.length,
      createdBy: userId,
      tags: tags,
    });

    await media.save();
    return media;
  } catch (error) {
    console.error(`Error creating media from URL: ${error.message}`);
    throw error;
  }
}

// Run the script
convertCoverImages();
