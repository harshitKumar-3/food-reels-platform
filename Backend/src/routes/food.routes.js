const express = require("express");
const foodController = require("../controllers/food.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

/* POST / api/food/Protected */
router.post(
  "/",
  authMiddleware.authFoodPartnerMiddleware,
  upload.single("video"),
  foodController.createFood,
);

/* GET /api/food/ [protected] */

router.get("/", authMiddleware.authUserMiddleware, foodController.getFoodItems);

/* POST /api/food/like [protected] */
router.post("/like", authMiddleware.authUserMiddleware, foodController.likeFood);

/* POST /api/food/save [protected] */
router.post("/save", authMiddleware.authUserMiddleware, foodController.saveFood);

/* GET /api/food/save [protected] */
router.get("/save", authMiddleware.authUserMiddleware, foodController.getSavedFoods);

/* GET /api/food-partner/foods [protected - food partner only] */
router.get(
  "/food-partner/foods",
  authMiddleware.authFoodPartnerMiddleware,
  foodController.getFoodPartnerFoods
);

/* GET /api/food-partner/:id [public] */
router.get(
  "/food-partner/:id",
  foodController.getFoodPartnerDetails
);

module.exports = router;
