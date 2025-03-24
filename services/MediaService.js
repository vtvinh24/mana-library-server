const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp"); // You'll need to install this: npm install sharp
const Media = require("#models/Media.js");
const { createDirectory } = require("#common/File.js");
const Env = require("#config/Env.js");
const { MEDIA_TYPE, MEDIA_FORMAT } = require("#enum/Fields.js");
const { log } = require("#common/Logger.js");

class MediaService {
  /**
   * Store media file and create Media document
   * @param {Object} file - Multer file object
   * @param {Object} options - Additional options
   * @returns {Promise<Media>} Created media document
   */
  async storeMedia(file, options = {}) {
    try {
      const { associatedBook, owner, description, isPublic, tags } = options;

      // Determine file type
      const mediaType = this.getMediaType(file.mimetype);
      const format = this.getMediaFormat(file.mimetype);

      // Determine storage method based on file size
      const SIZE_THRESHOLD = 100 * 1024; // 100KB
      const useInlineStorage = file.size < SIZE_THRESHOLD;

      const media = new Media({
        name: file.originalname,
        mediaType,
        format,
        mimeType: file.mimetype,
        size: file.size,
        owner: owner || null,
        description: description || null,
        tags: Array.isArray(tags) ? tags : tags || [],
        isPublic: isPublic || false,
        associatedBook: associatedBook || null,
        isInlineContent: useInlineStorage,
      });

      if (useInlineStorage) {
        // Store file content in database as Buffer
        const fileContent = await fs.readFile(file.path);
        media.content = fileContent;

        // Create thumbnail for images
        if (mediaType === MEDIA_TYPE[0]) {
          // Assuming MEDIA_TYPE[0] is "IMAGE"
          try {
            const thumbnail = await sharp(fileContent).resize(200, 200, { fit: "inside" }).toBuffer();

            media.variants = {
              thumbnail: {
                content: thumbnail,
                size: thumbnail.length,
              },
            };
          } catch (err) {
            log(`Error creating thumbnail: ${err.message}`, "WARN", "MEDIA");
          }
        }

        // Delete temp file
        await fs.unlink(file.path);
      } else {
        // Create organized directory structure
        const mediaDir = path.join(Env.DIR_MEDIA || "uploads", new Date().toISOString().split("T")[0]);

        await createDirectory(mediaDir);

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt);
        const fileName = `${baseName}-${Date.now()}${fileExt}`;
        const filePath = path.join(mediaDir, fileName);

        // Move file to permanent location
        await fs.rename(file.path, filePath);
        media.path = filePath;

        // Create thumbnail for images
        if (mediaType === MEDIA_TYPE[0]) {
          // Assuming MEDIA_TYPE[0] is "IMAGE"
          try {
            const thumbnailPath = path.join(mediaDir, `thumb-${fileName}`);
            await sharp(filePath).resize(200, 200, { fit: "inside" }).toFile(thumbnailPath);

            const thumbnailStats = await fs.stat(thumbnailPath);

            media.variants = {
              thumbnail: {
                path: thumbnailPath,
                size: thumbnailStats.size,
              },
            };
          } catch (err) {
            log(`Error creating thumbnail: ${err.message}`, "WARN", "MEDIA");
          }
        }
      }

      await media.save();
      return media;
    } catch (error) {
      // Ensure temp file cleanup on error
      if (file.path) {
        try {
          await fs.unlink(file.path).catch(() => {});
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }

  /**
   * Determine media type from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} Media type
   */
  getMediaType(mimeType) {
    if (mimeType.startsWith("image/")) return MEDIA_TYPE[0]; // IMAGE
    if (mimeType.startsWith("video/")) return MEDIA_TYPE[1]; // VIDEO
    if (mimeType.startsWith("audio/")) return MEDIA_TYPE[2]; // AUDIO
    if (mimeType.startsWith("application/pdf") || mimeType.startsWith("text/") || mimeType.includes("document")) return MEDIA_TYPE[3]; // DOCUMENT
    return MEDIA_TYPE[4]; // OTHER
  }

  /**
   * Determine media format from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} Media format
   */
  getMediaFormat(mimeType) {
    const format = mimeType.split("/")[1]?.toUpperCase();
    // Check if format exists in MEDIA_FORMAT enum
    return MEDIA_FORMAT.includes(format) ? format : MEDIA_FORMAT[0]; // Default to first format
  }
}

module.exports = new MediaService();
