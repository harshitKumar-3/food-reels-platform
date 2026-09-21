import React, { useState } from "react";
import API from "../utils/api";

const OrderModal = ({ food, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!food) return null;

  const partnerName = food.foodPartner?.name || food.foodPartnerName || "Restaurant";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      setError("Please fill in both delivery address and contact phone.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/api/orders", {
        foodId: food._id,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
      });

      if (onSuccess) {
        onSuccess(response.data.order);
      }
      onClose();
    } catch (err) {
      console.error("Order placement error:", err);
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface, #1e293b)",
          color: "var(--color-text, #f1f5f9)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          border: "1px solid var(--color-border, #334155)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Order Meal</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{food.name}</div>
          <div style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: "4px" }}>From: {partnerName}</div>
        </div>

        {error && (
          <div style={{ color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "10px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "6px", opacity: 0.8 }}>
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #334155)",
                background: "var(--color-surface-alt, #0f172a)",
                color: "inherit",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "6px", opacity: 0.8 }}>
              Delivery Address
            </label>
            <textarea
              rows="3"
              placeholder="Enter full delivery address with landmark..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #334155)",
                background: "var(--color-surface-alt, #0f172a)",
                color: "inherit",
                fontSize: "0.95rem",
                boxSizing: "border-box",
                resize: "vertical",
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "6px", opacity: 0.8 }}>
              Contact Phone
            </label>
            <input
              type="tel"
              placeholder="e.g., +91 9876543210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #334155)",
                background: "var(--color-surface-alt, #0f172a)",
                color: "inherit",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #334155)",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "var(--color-accent, #2563eb)",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Placing..." : "Confirm Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
