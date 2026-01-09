// src/routes/authRoutes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const {
  register,
  login,
  me,
  updateProfile,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// pasta para guardar avatares
const uploadDir = path.join(__dirname, "..", "..", "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, baseName + ext);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Só são permitidas imagens."));
    }
    cb(null, true);
  },
});

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);

// PUT /api/auth/profile
router.put(
  "/profile",
  authMiddleware,
  uploadAvatar.single("avatar"),
  updateProfile
);

module.exports = router;
