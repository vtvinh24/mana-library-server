const mongoose = require("mongoose");
const fs = require("fs").promises;
const baseSchema = require("./Base");
const { MEDIA_TYPE, MEDIA_FORMAT } = require("#enum/Fields.js");

const mediaSchema = new mongoose.Schema({
  /**
   * Human-readable name of the media file
   * Example: "Harry Potter Cover Image.jpg"
   */
  name: {
    type: String,
    required: true,
  },
  /**
   * Media type category
   * Example: "IMAGE", "VIDEO", "AUDIO", "DOCUMENT"
   */
  mediaType: {
    type: String,
    enum: MEDIA_TYPE,
    required: true,
  },
  /**
   * File system path for the media
   * Example: "/uploads/2023/04/15/cover-1681596432.jpg"
   * Only used when isInlineContent is false
   */
  path: {
    type: String,
    required: function () {
      return !this.isInlineContent;
    },
    trim: true,
  },
  /**
   * Storage method indicator
   * true: Media content stored in database as base64 (small files)
   * false: Media stored in filesystem with path reference
   * Example: true for small icons, false for large book PDFs
   */
  isInlineContent: {
    type: Boolean,
    default: false,
  },
  /**
   * Binary content data when stored directly in database
   * Used when isInlineContent is true
   * Example: Buffer containing image data
   */
  content: {
    type: Buffer,
    default: null,
  },
  /**
   * Indicates if the media is referenced by URL rather than stored
   * Example: true for YouTube video links, false for uploaded files
   */
  isUrl: {
    type: Boolean,
    default: false,
  },
  /**
   * Optional description of the media
   * Example: "Front cover image for first edition"
   */
  description: {
    type: String,
    default: null,
  },
  /**
   * MIME type of the media content
   * Example: "image/jpeg", "application/pdf", "video/mp4"
   */
  mimeType: {
    type: String,
    required: true,
    trim: true,
  },
  /**
   * File size in bytes
   * Example: 1048576 (1MB)
   */
  size: {
    type: Number,
    required: true,
  },
  /**
   * Reference to the user who uploaded/owns the media
   * Example: ObjectId("6079f815d3e87c001c34db15")
   */
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  /**
   * Descriptive tags for search and categorization
   * Example: ["cover", "fantasy", "fiction"]
   */
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  /**
   * External URL when isUrl is true
   * Example: "https://example.com/image.jpg"
   */
  url: {
    type: String,
    trim: true,
  },
  /**
   * Indicates if the media is publicly accessible
   * Example: true for public book covers, false for restricted content
   */
  isPublic: {
    type: Boolean,
    default: false,
  },
  /**
   * Additional metadata relevant to the specific media type
   * Example: { width: 1200, height: 800, camera: "Canon EOS R5" }
   */
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  /**
   * Specific format of the media file
   * Example: "JPEG", "PDF", "MP4"
   */
  format: {
    type: String,
    enum: MEDIA_FORMAT,
    required: true,
  },
  /**
   * Duration for audio/video content in seconds
   * Example: 180.5 (3 minutes and 5 seconds)
   */
  duration: {
    type: Number,
    default: null,
  },
  /**
   * Copyright and license details
   * Example: { holder: "Penguin Books", year: 2020, restrictions: "All rights reserved" }
   */
  copyright: {
    holder: { type: String, default: null },
    year: { type: Number, default: null },
    restrictions: { type: String, default: null },
  },
  /**
   * Book this media is associated with (if applicable)
   * Example: ObjectId("607a1e8bd3e87c001c34db18")
   */
  associatedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    default: null,
  },
  /**
   * Access control settings
   * Example: { requiresAuthentication: true, allowedRoles: ["ADMIN", "LIBRARIAN"], checkoutEnabled: false }
   */
  accessControl: {
    requiresAuthentication: {
      type: Boolean,
      default: true,
    },
    allowedRoles: {
      type: [String],
      default: [],
    },
    checkoutEnabled: {
      type: Boolean,
      default: false,
    },
    maxSimultaneousUsers: {
      type: Number,
      default: 1,
    },
    downloadLimit: {
      type: Number,
      default: null,
    },
  },
  /**
   * Media usage statistics
   * Example: { views: 256, downloads: 42, lastAccessed: ISODate("2023-04-15T12:30:45Z") }
   */
  stats: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: null },
  },
  /**
   * Optimized variants of the original media (primarily for images)
   * Example: {
   *   thumbnail: { path: "/uploads/2023/04/15/thumb-cover-1681596432.jpg", content: Buffer, size: 15360 },
   *   medium: { path: "/uploads/2023/04/15/medium-cover-1681596432.jpg", content: Buffer, size: 51200 }
   * }
   */
  variants: {
    thumbnail: {
      path: { type: String, default: null },
      content: { type: Buffer, default: null },
      size: { type: Number, default: null },
    },
    medium: {
      path: { type: String, default: null },
      content: { type: Buffer, default: null },
      size: { type: Number, default: null },
    },
  },
});

mediaSchema.add(baseSchema);

/**
 * Clean up associated files when a Media document is removed
 */
mediaSchema.pre("deleteOne", { document: true, query: false }, async function () {
  try {
    // Delete the original file
    if (!this.isInlineContent && this.path) {
      await fs.unlink(this.path);
    }

    // Delete variant files
    if (this.variants) {
      if (this.variants.thumbnail?.path) {
        await fs.unlink(this.variants.thumbnail.path);
      }
      if (this.variants.medium?.path) {
        await fs.unlink(this.variants.medium.path);
      }
    }
  } catch (err) {
    console.error("Error removing media files:", err);
  }
});

/**
 * Update stats when media is accessed
 */
mediaSchema.methods.recordView = async function () {
  this.stats.views += 1;
  this.stats.lastAccessed = new Date();
  return this.save();
};

/**
 * Record download and check limits
 */
mediaSchema.methods.recordDownload = async function () {
  // Check if download limit is reached
  if (this.accessControl.downloadLimit !== null && this.stats.downloads >= this.accessControl.downloadLimit) {
    throw new Error("Download limit reached");
  }

  this.stats.downloads += 1;
  this.stats.lastAccessed = new Date();
  return this.save();
};

const Media = mongoose.model("Media", mediaSchema);
module.exports = Media;
