import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import socket from "../../utils/socket";
import "../../styles/orders.css";

// Status timeline steps in order
const STATUS_STEPS = ["Placed", "Preparing", "Delivered"];

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let currentUserId = null;

    const fetchUserAndOrders = async () => {
      try {
        const userRes = await API.get("/api/auth/user/me");
        currentUserId = userRes.data.user._id;

        // Join personal user room for real-time updates
        socket.emit("join_user", currentUserId);

        const ordersRes = await API.get("/api/orders/user");
        setOrders(ordersRes.data.orders || []);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/");
        } else {
          console.error("Error fetching user orders:", err);
          setLoading(false);
        }
      }
    };

    fetchUserAndOrders();

    // Listen for live status updates emitted by the food partner
    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((ord) =>
          ord._id === updatedOrder._id ? { ...ord, ...updatedOrder } : ord
        )
      );
    };

    socket.on("order_status_updated", handleStatusUpdate);

    return () => {
      socket.off("order_status_updated", handleStatusUpdate);
    };
  }, [navigate]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered": return "order-status-badge order-status-badge--delivered";
      case "Cancelled": return "order-status-badge order-status-badge--cancelled";
      case "Placed":    return "order-status-badge order-status-badge--placed";
      case "Preparing":
      default:          return "order-status-badge order-status-badge--preparing";
    }
  };

  // Build timeline data for a given order
  const getTimeline = (order) => {
    if (order.status === "Cancelled") {
      const cancelledSteps = ["Placed", "Preparing", "Cancelled"];
      return cancelledSteps.map((step, i) => {
        let state;
        if (step === "Cancelled") state = "cancelled";
        else if (step === "Placed" || step === "Preparing") state = "done";
        else state = "pending";
        return { label: step, state };
      });
    }
    // Normal flow: Placed → Preparing → Delivered
    const currentIdx = STATUS_STEPS.indexOf(order.status);
    return STATUS_STEPS.map((step, i) => ({
      label: step,
      // steps BEFORE current are done, current is active, future are pending
      state: i < currentIdx ? "done" : i === currentIdx ? "active" : "pending",
    }));
  };

  // The line between step[i] and step[i+1] is "done" if step[i+1] has been reached
  const lineStateFor = (timeline, idx) => {
    const nextStep = timeline[idx + 1];
    if (!nextStep) return "pending";
    return nextStep.state === "pending" ? "pending" : "done";
  };

  return (
    <div className="orders-page">
      <header className="orders-page-header">
        <h1 className="orders-page-title">My Orders</h1>
        <p className="orders-page-subtitle">
          Track real-time status of your food orders
        </p>
      </header>

      {loading ? (
        <div className="orders-loading">Loading your orders…</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <p className="orders-empty-title">No orders placed yet</p>
          <p className="orders-empty-subtitle">
            Explore food reels and tap "Order Now" on meals you'd like to try!
          </p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const food = order.food || {};
            const partner = order.foodPartner || {};
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const timeline = getTimeline(order);

            return (
              <div key={order._id} className="order-card">
                {/* Header: food name + status badge */}
                <div className="order-card-header">
                  <div>
                    <div className="order-card-food-name">
                      {food.name || "Food Item"}
                    </div>
                    <div className="order-card-partner-name">
                      From: {partner.name || "Restaurant"}
                    </div>
                  </div>
                  <span className={getStatusClass(order.status)}>
                    {order.status}
                  </span>
                </div>

                {/* Status timeline */}
                <div className="order-timeline">
                  {timeline.map((step, idx) => (
                    <React.Fragment key={step.label}>
                      <div className={`order-timeline-step order-timeline-step--${step.state}`}>
                        <div className="order-timeline-dot" />
                        <span className="order-timeline-label">{step.label}</span>
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className={`order-timeline-line order-timeline-line--${lineStateFor(timeline, idx)}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Details grid */}
                <div className="order-card-details">
                  <div>
                    <span className="order-card-detail-label">Qty: </span>
                    <strong>{order.quantity}</strong>
                  </div>
                  <div>
                    <span className="order-card-detail-label">Phone: </span>
                    <strong>{order.contactPhone}</strong>
                  </div>
                  <div className="order-card-detail-full">
                    <span className="order-card-detail-label">Deliver to: </span>
                    {order.deliveryAddress}
                  </div>
                  {dateStr && (
                    <div className="order-card-timestamp">
                      Ordered: {dateStr}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
