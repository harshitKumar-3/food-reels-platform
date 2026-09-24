const mongoose = require("mongoose");
const orderModel = require("../models/order.model");
const foodModel = require("../models/food.model");

async function createOrder(req, res) {
  try {
    const { foodId, quantity, deliveryAddress, contactPhone } = req.body;
    const userId = req.user._id;

    if (!foodId || !deliveryAddress || !contactPhone) {
      return res.status(400).json({
        message: "foodId, deliveryAddress, and contactPhone are required",
      });
    }

    if (typeof deliveryAddress !== 'string' || typeof contactPhone !== 'string') {
      return res.status(400).json({
        message: "deliveryAddress and contactPhone must be valid text strings",
      });
    }

    const trimmedAddress = deliveryAddress.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedAddress || !trimmedPhone) {
      return res.status(400).json({
        message: "deliveryAddress and contactPhone cannot be empty",
      });
    }

    if (trimmedPhone.replace(/\D/g, '').length < 9) {
      return res.status(400).json({
        message: "Invalid phone number format",
      });
    }

    // Validate quantity if provided
    let orderQuantity = 1;
    if (quantity !== undefined && quantity !== null) {
      const numQty = Number(quantity);
      if (isNaN(numQty) || !Number.isInteger(numQty) || numQty < 1) {
        return res.status(400).json({
          message: "Quantity must be an integer greater than or equal to 1",
        });
      }
      orderQuantity = numQty;
    }

    // Validate foodId format
    if (!mongoose.Types.ObjectId.isValid(foodId)) {
      return res.status(400).json({
        message: "Invalid food ID format",
      });
    }

    const food = await foodModel.findById(foodId);
    if (!food) {
      return res.status(404).json({
        message: "Food item not found",
      });
    }

    if (!food.foodPartner) {
      return res.status(400).json({
        message: "Food item has no associated food partner",
      });
    }

    // Duplicate order submission protection:
    // If an identical order from this user for the same food item, quantity, and address
    // was placed within the last 5 seconds, prevent duplicate creation and return the existing order
    const recentDuplicate = await orderModel.findOne({
      user: userId,
      food: food._id,
      quantity: orderQuantity,
      deliveryAddress: trimmedAddress,
      status: "Placed",
      createdAt: { $gte: new Date(Date.now() - 5000) },
    })
      .populate("food", "name video description")
      .populate("user", "fullName email")
      .populate("foodPartner", "name address phone contactName");

    if (recentDuplicate) {
      return res.status(200).json({
        message: "Order placed successfully",
        order: recentDuplicate,
      });
    }

    const order = await orderModel.create({
      user: userId,
      foodPartner: food.foodPartner,
      food: food._id,
      quantity: orderQuantity,
      deliveryAddress: trimmedAddress,
      contactPhone: trimmedPhone,
      status: "Placed",
    });

    const populatedOrder = await orderModel
      .findById(order._id)
      .populate("food", "name video description")
      .populate("user", "fullName email")
      .populate("foodPartner", "name address phone contactName");

    // Real-time: notify the food partner of the new order
    const io = req.app.get("io");
    if (io) {
      io.to(`partner_${food.foodPartner.toString()}`).emit("new_order", populatedOrder);
    }

    res.status(201).json({
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Server error while creating order",
    });
  }
}

async function getUserOrders(req, res) {
  try {
    const userId = req.user._id;

    const orders = await orderModel
      .find({ user: userId })
      .populate("food", "name video description")
      .populate("foodPartner", "name address phone contactName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "User orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      message: "Server error while fetching orders",
    });
  }
}

async function getPartnerOrders(req, res) {
  try {
    const partnerId = req.foodPartner._id;

    const orders = await orderModel
      .find({ foodPartner: partnerId })
      .populate("food", "name video description")
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Partner orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching partner orders:", error);
    res.status(500).json({
      message: "Server error while fetching orders",
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const partnerId = req.foodPartner._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Enforce ownership: partner can only update their own orders
    if (order.foodPartner.toString() !== partnerId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: You can only update orders for your own restaurant",
      });
    }

    // ── Allowed transition map ────────────────────────────────────────────
    // Placed      → Preparing
    // Preparing   → Delivered | Cancelled
    // Delivered   → (terminal — no further changes)
    // Cancelled   → (terminal — no further changes)
    const allowedTransitions = {
      Placed:    ["Preparing"],
      Preparing: ["Delivered", "Cancelled"],
    };

    const allowed = allowedTransitions[order.status];
    if (!allowed) {
      return res.status(400).json({
        message: `Order is already ${order.status} and cannot be modified`,
      });
    }

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(", ")}`,
      });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await orderModel
      .findById(order._id)
      .populate("food", "name video description")
      .populate("user", "fullName email")
      .populate("foodPartner", "name address phone contactName");

    // Real-time: notify the customer
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${order.user.toString()}`).emit("order_status_updated", populatedOrder);
    }

    res.status(200).json({
      message: `Order status updated to ${status}`,
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error while updating order status" });
  }
}


module.exports = {
  createOrder,
  getUserOrders,
  getPartnerOrders,
  updateOrderStatus,
};
