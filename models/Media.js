const mongoose = require("mongoose");
const baseSchema = require("./Base");
const { MEDIA_TYPE, MEDIA_FORMAT } = require("#enum/Fields.js");

const mediaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  /**
   * path: /uploads/2021/07/08/abc.jpg
   */
  mediaType: {
    type: String,
    enum: MEDIA_TYPE,
    required: true,
  },
  path: {
    type: String,
    required: true,
    trim: true,
  },
  /**
   * isUrl: true, false
   * If isUrl is true, the media is a URL, otherwise it is a file.
   */
  isUrl: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: null,
  },
  mimeType: {
    type: String,
    required: true,
    trim: true,
  },
  /**
   * size: bytes
   */
  size: {
    type: Number,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  url: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Specific format of the media file
  format: {
    type: String,
    enum: MEDIA_FORMAT,
    required: true,
  },

  // For audio/video content (in seconds)
  duration: {
    type: Number,
    default: null,
  },

  // Copyright and license details
  copyright: {
    holder: { type: String, default: null },
    year: { type: Number, default: null },
    restrictions: { type: String, default: null },
  },

  // Associated book if this is supplementary material
  associatedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    default: null,
  },

  // Library-specific access controls
  accessControl: {
    // Whether it requires authentication to access
    requiresAuthentication: {
      type: Boolean,
      default: true,
    },
    // Which user roles can access this media
    allowedRoles: {
      type: [String],
      default: [],
    },
    // Whether the item can be borrowed/checked out
    checkoutEnabled: {
      type: Boolean,
      default: false,
    },
    // Maximum number of allowed simultaneous users
    maxSimultaneousUsers: {
      type: Number,
      default: 1,
    },
    // Download limitations
    downloadLimit: {
      type: Number,
      default: null, // null means unlimited
    },
  },

  // Media usage statistics
  stats: {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: null },
  },
});

mediaSchema.add(baseSchema);

const Media = mongoose.model("Media", mediaSchema);
module.exports = Media;
