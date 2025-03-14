const multer = require("multer");
const path = require("path");
const { createDirectory } = require("./File");
const Env = require("#config/Env.js");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "", Env.DIR_MEDIA, new Date().toISOString().split("T")[0]);
    await createDirectory(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = {
  upload,
};
