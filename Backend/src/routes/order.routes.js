const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// User order APIs
router.post("/", authMiddleware.authUserMiddleware, orderController.createOrder);
router.get("/user", authMiddleware.authUserMiddleware, orderController.getUserOrders);

// Food Partner order APIs
router.get("/partner", authMiddleware.authFoodPartnerMiddleware, orderController.getPartnerOrders);
router.patch("/:id/status", authMiddleware.authFoodPartnerMiddleware, orderController.updateOrderStatus);

module.exports = router;
