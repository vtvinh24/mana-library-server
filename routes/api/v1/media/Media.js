const { log } = require("#common/Logger.js");
const Media = require("#models/Media.js");
const MediaService = require("#services/MediaService.js");
const fs = require("fs").promises;
const path = require("path");
const { ROLE } = require("#enum/Fields.js");

/**
 * Handle media upload
 */
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { bookId, isPublic, description, tags } = req.body;

    const options = {
      associatedBook: bookId || null,
      owner: req.userId,
      isPublic: isPublic === "true",
      description: description || null,
      tags: tags ? tags.split(",") : [],
    };

    const media = await MediaService.storeMedia(req.file, options);

    return res.status(201).json({
      media: {
        _id: media._id,
        name: media.name,
        mediaType: media.mediaType,
        mimeType: media.mimeType,
        isInlineContent: media.isInlineContent,
        isPublic: media.isPublic,
        size: media.size,
        format: media.format,
      },
    });
  } catch (error) {
    log(`Error uploading media: ${error.message}`, "ERROR", "MEDIA");
    return res.status(500).json({ message: "Failed to upload media" });
  }
};

/**
 * Retrieve media file with access control
 */
const getMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Check access permissions
    if (!media.isPublic) {
      // If not public, only owner, admins, or users with explicit access can view
      if (!req.authenticated || (media.owner && media.owner.toString() !== req.userId && req.role !== ROLE.ADMIN && !media.accessControl.allowedRoles.includes(req.role))) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Record view
    await media.recordView();

    if (media.isInlineContent && media.content) {
      // Serve base64 content
      const buffer = media.content;
      res.set("Content-Type", media.mimeType);
      return res.send(buffer);
    } else if (media.isUrl) {
      // Redirect to external URL
      return res.redirect(media.url);
    } else if (media.path) {
      // Serve file from filesystem
      return res.sendFile(path.resolve(media.path));
    } else {
      return res.status(404).json({ message: "Media content not available" });
    }
  } catch (error) {
    log(`Error serving media: ${error.message}`, "ERROR", "MEDIA");
    return res.status(500).json({ message: "Failed to retrieve media" });
  }
};

/**
 * Get thumbnail for media
 */
const getMediaThumbnail = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Check for thumbnail
    if (media.variants && media.variants.thumbnail) {
      if (media.variants.thumbnail.content) {
        // Serve inline thumbnail
        const buffer = media.variants.thumbnail.content;
        res.set("Content-Type", media.mimeType);
        return res.send(buffer);
      } else if (media.variants.thumbnail.path) {
        // Serve file from filesystem
        return res.sendFile(path.resolve(media.variants.thumbnail.path));
      }
    }

    // If no thumbnail available, serve original with a note
    return getMedia(req, res);
  } catch (error) {
    log(`Error serving thumbnail: ${error.message}`, "ERROR", "MEDIA");
    return res.status(500).json({ message: "Failed to retrieve thumbnail" });
  }
};

/**
 * Update media metadata
 */
const updateMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { name, description, isPublic, tags } = req.body;

    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Only owner or admin can update
    if (media.owner.toString() !== req.userId && req.role !== ROLE.ADMIN) {
      return res.status(403).json({ message: "Not authorized to update this media" });
    }

    // Update fields
    if (name) media.name = name;
    if (description !== undefined) media.description = description;
    if (isPublic !== undefined) media.isPublic = isPublic === true || isPublic === "true";
    if (tags) media.tags = Array.isArray(tags) ? tags : tags.split(",");

    await media.save();

    return res.status(200).json({
      message: "Media updated successfully",
      media: {
        _id: media._id,
        name: media.name,
        description: media.description,
        isPublic: media.isPublic,
        tags: media.tags,
      },
    });
  } catch (error) {
    log(`Error updating media: ${error.message}`, "ERROR", "MEDIA");
    return res.status(500).json({ message: "Failed to update media" });
  }
};

/**
 * Delete media
 */
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;

    const media = await Media.findById(mediaId);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Only owner or admin can delete
    if (media.owner.toString() !== req.userId && req.role !== ROLE.ADMIN) {
      return res.status(403).json({ message: "Not authorized to delete this media" });
    }

    // Use pre hook for file deletion
    await media.deleteOne();

    return res.status(200).json({ message: "Media deleted successfully" });
  } catch (error) {
    log(`Error deleting media: ${error.message}`, "ERROR", "MEDIA");
    return res.status(500).json({ message: "Failed to delete media" });
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  getMediaThumbnail,
  updateMedia,
  deleteMedia,
};
