import express from "express";
import discovery from "./controllers/discovery.js";
import searchHandler from "./controllers/search.js";
import detailsHandler from "./controllers/details.js";
import genresHandler from "./controllers/genres.js";
import { saveLike, saveDislike, createUser, getUserLikes } from "./controllers/userPreferences.js";

const router = express.Router();

router.get("/discover", discovery);
router.get("/search", searchHandler);
router.get("/details/:id", detailsHandler);
router.get("/genres", genresHandler);

// user pref endpoints
router.post("/likes", saveLike);
router.post("/dislikes", saveDislike);
router.post("/users", createUser);
router.get("/likes", getUserLikes);

export default router;
