const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// User auth APIs
router.post("/user/register", authController.registerUser);
router.post("/user/login", authController.loginUser);
router.get("/user/logout", authController.logoutUser);
router.get("/user/me", authMiddleware.authUserMiddleware, authController.getCurrentUser);

// Food Partner auth APIs
router.post("/food-partner/register", authController.registerFoodPartner);
router.post("/food-partner/login", authController.loginFoodPartner);
router.get("/food-partner/logout", authController.logoutFoodPartner);
router.get("/food-partner/profile", authMiddleware.authFoodPartnerMiddleware, authController.getFoodPartnerProfile);

// Common: works for both users and food-partners
router.get("/me", authMiddleware.authAnyMiddleware, authController.getCurrentUser);

module.exports = router;
