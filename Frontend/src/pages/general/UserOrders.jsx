import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import socket from "../../utils/socket";
import "../../styles/reels.css";

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return {
          label: "Delivered",
          bg: "rgba(34, 197, 94, 0.15)",
          color: "#22c55e",
          border: "1px solid rgba(34, 197, 94, 0.3)",
        };
      case "Cancelled":
        return {
          label: "Cancelled",
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        };
      case "Preparing":
      default:
        return {
          label: "Preparing",
          bg: "rgba(234, 179, 8, 0.15)",
          color: "#eab308",
          border: "1px solid rgba(234, 179, 8, 0.3)",
        };
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg, #0f172a)",
        color: "var(--color-text, #f1f5f9)",
        padding: "24px 16px 80px",
        maxWidth: "600px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", margin: "0 0 6px" }}>My Orders</h1>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary, #94a3b8)" }}>
          Track real-time status of your food orders
        </p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "var(--color-surface, #1e293b)",
            borderRadius: "16px",
            border: "1px solid var(--color-border, #334155)",
          }}
        >
          <p style={{ fontSize: "1.1rem", fontWeight: "600", margin: "0 0 8px" }}>No orders placed yet</p>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
            Explore food reels and tap "Order Now" on meals you'd like to try!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
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

            return (
              <div
                key={order._id}
                style={{
                  background: "var(--color-surface, #1e293b)",
                  borderRadius: "14px",
                  padding: "16px",
                  border: "1px solid var(--color-border, #334155)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{food.name || "Food Item"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>
                      From: {partner.name || "Restaurant"}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.85rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    padding: "10px",
                    background: "rgba(0,0,0,0.15)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <span style={{ color: "#94a3b8" }}>Quantity:</span> <strong>{order.quantity}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Phone:</span> <strong>{order.contactPhone}</strong>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#94a3b8" }}>Deliver to:</span> <span>{order.deliveryAddress}</span>
                  </div>
                </div>

                {dateStr && (
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
                    Ordered: {dateStr}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
