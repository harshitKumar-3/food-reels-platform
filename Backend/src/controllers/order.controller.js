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

    const trimmedAddress = deliveryAddress.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedAddress || !trimmedPhone) {
      return res.status(400).json({
        message: "deliveryAddress and contactPhone cannot be empty",
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

    const orderQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    const order = await orderModel.create({
      user: userId,
      foodPartner: food.foodPartner,
      food: food._id,
      quantity: orderQuantity,
      deliveryAddress: trimmedAddress,
      contactPhone: trimmedPhone,
      status: "Preparing",
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

    const validStatuses = ["Delivered", "Cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status can only be updated to Delivered or Cancelled",
      });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Enforce ownership: partner can only update their own orders
    if (order.foodPartner.toString() !== partnerId.toString()) {
      return res.status(403).json({
        message: "Unauthorized: You can only update orders for your own restaurant",
      });
    }

    // Constraint: Once Delivered or Cancelled, cannot be changed back
    if (order.status !== "Preparing") {
      return res.status(400).json({
        message: `Order is already ${order.status} and cannot be modified`,
      });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await orderModel
      .findById(order._id)
      .populate("food", "name video description")
      .populate("user", "fullName email")
      .populate("foodPartner", "name address phone contactName");

    // Real-time: notify the customer that their order status was updated
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
    res.status(500).json({
      message: "Server error while updating order status",
    });
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getPartnerOrders,
  updateOrderStatus,
};
