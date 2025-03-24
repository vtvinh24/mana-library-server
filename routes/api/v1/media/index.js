const express = require("express");
const router = express.Router();
const { upload } = require("#common/Multer.js");
const { requireAuth, requireRoles } = require("#middlewares/JWT.js");
const { ROLE } = require("#enum/Fields.js");
const { uploadMedia, getMedia, getMediaThumbnail, updateMedia, deleteMedia } = require("./Media");

// Upload new media
router.post("/upload", requireAuth, upload.single("file"), uploadMedia);

// Get media by ID (with access control)
router.get("/:mediaId", getMedia);

// Get thumbnail for media
router.get("/:mediaId/thumbnail", getMediaThumbnail);

// Update media metadata (owner or admin only)
router.patch("/:mediaId", requireAuth, updateMedia);

// Delete media (owner or admin only)
router.delete("/:mediaId", requireAuth, deleteMedia);

module.exports = router;
