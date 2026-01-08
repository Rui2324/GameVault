// src/routes/collectionRoutes.js
const express = require("express");
const {
  listMyCollection,
  addToMyCollection,
  updateMyCollectionEntry,
  removeMyCollectionEntry,
} = require("../controllers/collectionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listMyCollection);
router.post("/", addToMyCollection);
router.put("/:id", updateMyCollectionEntry);
router.delete("/:id", removeMyCollectionEntry);

module.exports = router;
