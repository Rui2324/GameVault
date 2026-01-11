// src/routes/collectionRoutes.js
const express = require("express");
const router = express.Router();

const {
  listMyCollection,
  getMyCollectionEntry,
  addToMyCollection,
  updateMyCollectionEntry,
  removeMyCollectionEntry,
} = require("../controllers/collectionController");

// /api/collection
router.get("/", listMyCollection);
router.post("/", addToMyCollection);

// /api/collection/:id
router.get("/:id", getMyCollectionEntry);
router.put("/:id", updateMyCollectionEntry);
router.delete("/:id", removeMyCollectionEntry);

module.exports = router;