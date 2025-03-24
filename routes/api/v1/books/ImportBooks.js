const Book = require("#models/Book.js");
const Media = require("#models/Media.js");
const MediaService = require("#services/MediaService.js");
const { log } = require("#common/Logger.js");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const axios = require("axios");
const path = require("path");
const { createDirectory } = require("#common/File.js");
const Env = require("#config/Env.js");
const { MEDIA_TYPE, MEDIA_FORMAT } = require("#enum/Fields.js");

// Middleware to handle file upload
const handleFileUpload = upload.single("booksFile");

async function importBooks(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read uploaded JSON file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, "utf8");
    const booksData = JSON.parse(fileContent);

    // Cleanup temp file after reading
    fs.unlinkSync(filePath);

    if (!Array.isArray(booksData)) {
      return res.status(400).json({ message: "Invalid file format. Expected array of books." });
    }

    let imported = 0;
    let errors = [];

    // Process each book in the JSON array
    for (const bookData of booksData) {
      try {
        // Check for duplicate ISBN if provided
        if (bookData.ISBN) {
          const existingBook = await Book.findOne({ ISBN: bookData.ISBN });
          if (existingBook) {
            errors.push({
              book: bookData.title || "Unknown",
              error: `Book with ISBN ${bookData.ISBN} already exists`,
            });
            continue;
          }
        }

        // Handle cover image - create Media document if URL exists
        let coverImageId = null;
        if (bookData.coverImage) {
          try {
            // Create media document for the cover image
            const media = await createMediaFromUrl(bookData.coverImage, `${bookData.title} - Cover Image`, req.userId, bookData.tags);
            coverImageId = media._id;
          } catch (mediaError) {
            log(`Error creating cover image for ${bookData.title}: ${mediaError.message}`, "ERROR", "IMPORT");
            // Continue with import even if cover image fails
          }
        }

        // Create book with media reference
        await Book.create({
          title: bookData.title,
          author: bookData.author,
          ISBN: bookData.ISBN,
          publisher: bookData.publisher,
          publicationYear: bookData.publicationYear,
          genre: Array.isArray(bookData.genre) ? bookData.genre : bookData.genre ? [bookData.genre] : [],
          description: bookData.description,
          pages: bookData.pages,
          language: bookData.language || "English",
          coverImage: coverImageId, // Use the Media document reference
          location: bookData.location,
          condition: bookData.condition || "good",
          copies: bookData.copies || 1,
          price: bookData.price,
          deweyDecimal: bookData.deweyDecimal,
          tags: Array.isArray(bookData.tags) ? bookData.tags : bookData.tags ? [bookData.tags] : [],
          createdBy: req.userId,
        });

        imported++;
      } catch (bookError) {
        errors.push({
          book: bookData.title || "Unknown",
          error: bookError.message,
        });
      }
    }

    return res.status(200).json({
      message: `Imported ${imported} books successfully`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log(error.message, "ERROR", "routes POST /books/import");
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Creates a Media document from a URL
 * @param {string} url - URL of the image
 * @param {string} name - Name for the media
 * @param {string} userId - User ID creating the media
 * @param {Array} tags - Tags for the media
 * @returns {Promise<Media>} Created media document
 */
async function createMediaFromUrl(url, name, userId, tags = []) {
  try {
    // Download the image
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "arraybuffer",
    });

    // Get file info
    const contentType = response.headers["content-type"];
    const extension = contentType.split("/")[1];
    const buffer = Buffer.from(response.data, "binary");
    const size = buffer.length;

    // Determine if we should store inline or as file
    const SIZE_THRESHOLD = 100 * 1024; // 100KB
    const useInlineStorage = size < SIZE_THRESHOLD;

    // Create media document
    const media = new Media({
      name: name,
      mediaType: "IMAGE", // Assuming these are all images
      format: extension.toUpperCase(),
      mimeType: contentType,
      size: size,
      isInlineContent: useInlineStorage,
      owner: userId,
      tags: tags || [],
      isPublic: true,
    });

    if (useInlineStorage) {
      // Store the content directly in the database
      media.content = buffer;

      // Generate thumbnail
      const thumbnail = await sharp(buffer).resize(200, 200, { fit: "inside" }).toBuffer();

      media.variants = {
        thumbnail: {
          content: thumbnail,
          size: thumbnail.length,
        },
      };
    } else {
      // Store in filesystem
      const uploadDir = path.join(Env.DIR_MEDIA || "uploads", new Date().toISOString().split("T")[0]);

      await createDirectory(uploadDir);

      const fileName = `cover-${Date.now()}.${extension}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, buffer);
      media.path = filePath;

      // Generate thumbnail
      const thumbnailPath = path.join(uploadDir, `thumb-${fileName}`);
      await sharp(buffer).resize(200, 200, { fit: "inside" }).toFile(thumbnailPath);

      const thumbnailStats = await fs.promises.stat(thumbnailPath);

      media.variants = {
        thumbnail: {
          path: thumbnailPath,
          size: thumbnailStats.size,
        },
      };
    }

    await media.save();
    return media;
  } catch (error) {
    throw new Error(`Failed to create media from URL: ${error.message}`);
  }
}

module.exports = { importBooks, handleFileUpload };
