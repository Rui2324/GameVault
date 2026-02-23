const express = require("express");
const router = express.Router();

const {
  listMyCollection,
  getMyCollectionEntry,
  getMyCollectionEntryByGameId,
  addToMyCollection,
  updateMyCollectionEntry,
  removeMyCollectionEntry,
} = require("../controllers/collectionController");

// /api/collection
router.get("/", listMyCollection);
router.post("/", addToMyCollection);

// /api/collection/by-game/:gameId - Buscar pela game_id 
router.get("/by-game/:gameId", getMyCollectionEntryByGameId);

// /api/collection/:id
router.get("/:id", getMyCollectionEntry);
router.put("/:id", updateMyCollectionEntry);
router.delete("/:id", removeMyCollectionEntry);

module.exports = router;