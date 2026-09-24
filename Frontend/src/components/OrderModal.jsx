import React, { useState, useRef } from "react";
import API from "../utils/api";
import "../styles/orders.css";

import PhoneInput, { validatePhone } from "./PhoneInput";

const OrderModal = ({ food, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isSubmittingRef = useRef(false);

  if (!food) return null;

  const partnerName =
    food.foodPartner?.name || food.foodPartnerName || "Restaurant";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    setErrors({});
    let newErrors = {};

    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = "Delivery address is required";
    }

    const [countryCode, ...phoneParts] = contactPhone.split(" ");
    const phoneError = validatePhone(countryCode || '+91', phoneParts.join(" ") || contactPhone);
    if (phoneError) {
      newErrors.contactPhone = phoneError;
    }

    if (quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    isSubmittingRef.current = true;
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
      setErrors({ form: err.response?.data?.message || "Failed to place order. Please try again." });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div
        className="order-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-modal-header">
          <h2 className="order-modal-title">Order Meal</h2>
          <button
            className="order-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="order-modal-food-info">
          <div className="order-modal-food-name">{food.name}</div>
          <div className="order-modal-food-partner">From: {partnerName}</div>
        </div>

        {errors.form && <div className="order-modal-error">{errors.form}</div>}

        <form className="order-modal-form" onSubmit={handleSubmit}>
          <div>
            <label className="order-modal-label">Quantity</label>
            <input
              className={`order-modal-input ${errors.quantity ? 'input-error' : ''}`}
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              required
            />
            {errors.quantity && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px', display: 'block' }}>{errors.quantity}</span>}
          </div>

          <div>
            <label className="order-modal-label">Delivery Address</label>
            <textarea
              className={`order-modal-textarea ${errors.deliveryAddress ? 'input-error' : ''}`}
              rows="3"
              placeholder="Enter full delivery address with landmark..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              style={errors.deliveryAddress ? { border: '1px solid #f43f5e' } : {}}
            />
            {errors.deliveryAddress && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px', display: 'block' }}>{errors.deliveryAddress}</span>}
          </div>

          <div>
            <label className="order-modal-label">Contact Phone</label>
            <PhoneInput 
              value={contactPhone} 
              onChange={setContactPhone} 
              error={errors.contactPhone} 
            />
          </div>

          <div className="order-modal-footer">
            <button
              type="button"
              className="order-modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="order-modal-btn-submit"
              disabled={loading}
            >
              {loading ? "Placing…" : "Confirm Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;
