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

router.get("/", authMiddleware.authAnyMiddleware, foodController.getFoodItems);

/* POST /api/food/like [protected] */
router.post("/like", authMiddleware.authAnyMiddleware, foodController.likeFood);

/* POST /api/food/save [protected] */
router.post("/save", authMiddleware.authAnyMiddleware, foodController.saveFood);

/* GET /api/food/save [protected] */
router.get("/save", authMiddleware.authAnyMiddleware, foodController.getSavedFoods);

/* GET /api/food-partner/foods [protected - food partner only] */
router.get(
  "/food-partner/foods",
  authMiddleware.authFoodPartnerMiddleware,
  foodController.getFoodPartnerFoods
);

/* GET /api/food-partner/:id [public - optional auth] */
router.get(
  "/food-partner/:id",
  authMiddleware.optionalAuthMiddleware,
  foodController.getFoodPartnerDetails
);

/* POST /api/food/comments [protected] */

router.post(
    "/comments",
    authMiddleware.authAnyMiddleware,
    foodController.addComment
);

/* GET /api/food/comments/:foodId [protected] */

router.get(
    "/comments/:foodId",
    authMiddleware.authAnyMiddleware,
    foodController.getComments
);

/* DELETE /api/food/comments/:commentId [protected - own comments only] */
router.delete(
    "/comments/:commentId",
    authMiddleware.authAnyMiddleware,
    foodController.deleteComment
);

/* DELETE /api/food/:id [protected - food partner only] */
router.delete(
    "/:id",
    authMiddleware.authFoodPartnerMiddleware,
    foodController.deleteFood
);

module.exports = router;
