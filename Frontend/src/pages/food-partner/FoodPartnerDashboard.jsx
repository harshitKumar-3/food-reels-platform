import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import socket from '../../utils/socket';
import '../../styles/profile.css';
import ReelGrid from '../../components/ReelGrid';
import ReelViewer from '../../components/ReelViewer';
import logo from "../../assets/logo.png";

const STATUS_BADGE = {
    Preparing: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' },
    Delivered:  { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
    Cancelled:  { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
};

const FoodPartnerDashboard = () => {
    const [foodPartner, setFoodPartner] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [totalMeals, setTotalMeals] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedReelIndex, setSelectedReelIndex] = useState(0);

    // ─── Order management state ────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [statusUpdating, setStatusUpdating] = useState({}); // { [orderId]: true/false }

    const navigate = useNavigate();

    // ─── Fetch partner orders ──────────────────────────────────────────────────
    const fetchPartnerOrders = async () => {
        try {
            const res = await API.get('/api/orders/partner');
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error('Error fetching partner orders:', err);
        }
    };

    // ─── Update order status ───────────────────────────────────────────────────
    const handleUpdateStatus = async (orderId, newStatus) => {
        setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));
        try {
            const res = await API.patch(`/api/orders/${orderId}/status`, { status: newStatus });
            const updated = res.data.order;
            setOrders((prev) =>
                prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o))
            );
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update order status.');
        } finally {
            setStatusUpdating((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    useEffect(() => {
        let isMounted = true;

        const fetchFoodPartnerData = async (attempt = 1) => {
            try {
                const profileResponse = await API.get("/api/auth/food-partner/profile");

                if (!isMounted) return;

                const currentPartner = profileResponse.data.foodPartner;
                setFoodPartner(currentPartner);

                // ── Join partner socket room for real-time new order notifications ──
                if (currentPartner?._id) {
                    socket.emit('join_partner', currentPartner._id);
                }

                // ── Fetch initial orders ──
                fetchPartnerOrders();

                let partnerFoodItems = [];

                try {
                    const foodResponse = await API.get("/api/food/food-partner/foods");
                    partnerFoodItems = foodResponse.data.foodItems || [];
                } catch (err) {
                    console.warn("Protected foods failed, trying fallback...");
                }

                if (partnerFoodItems.length === 0 && currentPartner?._id) {
                    const fallbackResponse = await API.get(`/api/food/food-partner/${currentPartner._id}`);
                    partnerFoodItems = fallbackResponse.data.foodPartner?.foodItems || [];
                }

                if (!isMounted) return;

                setFoodItems(partnerFoodItems);
                setTotalMeals(partnerFoodItems.length);
                setLoading(false);

            } catch (error) {
                console.error("Dashboard error:", error);

                const status = error?.response?.status;

                if (attempt < 2) {
                    setTimeout(() => fetchFoodPartnerData(attempt + 1), 500);
                    return;
                }

                if (status === 401 || status === 403) {
                    alert("Session expired. Please login again.");
                    navigate("/food-partner/login");
                }

                setLoading(false);
            }
        };

        fetchFoodPartnerData();

        // ── Real-time: new order arrives ──────────────────────────────────────
        const handleNewOrder = (newOrder) => {
            if (!isMounted) return;
            setOrders((prev) => [newOrder, ...prev]);
        };

        socket.on('new_order', handleNewOrder);

        return () => {
            isMounted = false;
            socket.off('new_order', handleNewOrder);
        };
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await API.get("/api/auth/food-partner/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            navigate("/food-partner/login");
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <section className="profile-header">
                <div className="profile-meta">
                    <img
                        className="profile-avatar"
                        src={logo}
                        alt="Restaurant"
                    />

                    <div className="profile-info">
                        <h1 className="profile-business">{foodPartner?.name}</h1>
                        <p className="profile-address">{foodPartner?.address}</p>
                        <p>Contact: {foodPartner?.phone}</p>
                        <p>Email: {foodPartner?.email}</p>
                    </div>
                </div>

                <div className="profile-stats">
                    <div>
                        <span>Total Meals</span>
                        <strong>{totalMeals}</strong>
                    </div>
                    <div>
                        <span>Total Likes</span>
                        <strong>
                            {foodItems.reduce((sum, item) => sum + (item.likeCount || 0), 0)}
                        </strong>
                    </div>
                </div>
            </section>

            <div style={{ padding: '20px', textAlign: 'center' }}>
                <button onClick={() => navigate('/create-food')}>
                    Create Food
                </button>

                <button onClick={handleLogout} style={{ marginLeft: '10px' }}>
                    Logout
                </button>
            </div>

            <hr />

            {/* ─── Orders Section ────────────────────────────────────────────── */}
            <div style={{ padding: '0 20px 30px' }}>
                <h2>Incoming Orders ({orders.length})</h2>

                {orders.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        No orders yet. Orders placed by customers will appear here in real time.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {orders.map((order) => {
                            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.Preparing;
                            const food = order.food || {};
                            const customer = order.user || {};
                            const isPreparing = order.status === 'Preparing';
                            const isUpdating = !!statusUpdating[order._id];
                            const dateStr = order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString([], {
                                    month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                  })
                                : '';

                            return (
                                <div
                                    key={order._id}
                                    style={{
                                        background: 'var(--color-surface, #1e293b)',
                                        border: '1px solid var(--color-border, #334155)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                    }}
                                >
                                    {/* Header row: food name + status badge */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>
                                                {food.name || 'Food Item'}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
                                                Customer: {customer.fullName || customer.email || 'Unknown'}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '3px 10px',
                                            borderRadius: '999px',
                                            fontSize: '0.78rem',
                                            fontWeight: '700',
                                            backgroundColor: badge.bg,
                                            color: badge.color,
                                            border: badge.border,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Details grid */}
                                    <div style={{
                                        fontSize: '0.83rem',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '6px',
                                        padding: '10px',
                                        background: 'rgba(0,0,0,0.15)',
                                        borderRadius: '8px',
                                    }}>
                                        <div><span style={{ color: '#94a3b8' }}>Qty:</span> <strong>{order.quantity}</strong></div>
                                        <div><span style={{ color: '#94a3b8' }}>Phone:</span> <strong>{order.contactPhone}</strong></div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ color: '#94a3b8' }}>Deliver to:</span> {order.deliveryAddress}
                                        </div>
                                        {dateStr && (
                                            <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: '0.75rem' }}>
                                                Ordered: {dateStr}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status action buttons — only shown while Preparing */}
                                    {isPreparing && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'rgba(34,197,94,0.2)',
                                                    color: '#22c55e',
                                                    fontWeight: '700',
                                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                    opacity: isUpdating ? 0.6 : 1,
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {isUpdating ? 'Updating...' : '✓ Delivered'}
                                            </button>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'rgba(239,68,68,0.15)',
                                                    color: '#ef4444',
                                                    fontWeight: '700',
                                                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                                                    opacity: isUpdating ? 0.6 : 1,
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {isUpdating ? 'Updating...' : '✕ Cancel'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <hr />

            {/* ─── Food Reels Section ────────────────────────────────────────── */}
            <div style={{ padding: '0 20px' }}>
                <h2>Your Food Reels ({foodItems.length})</h2>

                <ReelGrid
                    items={foodItems}
                    onItemClick={(item) => {
                        const index = foodItems.findIndex(f => f._id === item._id);
                        setSelectedReelIndex(index);
                        setViewerOpen(true);
                    }}
                />
            </div>

            {viewerOpen && (
                <ReelViewer
                    items={foodItems}
                    initialIndex={selectedReelIndex}
                    onClose={() => setViewerOpen(false)}
                />
            )}
        </div>
    );
};

export default FoodPartnerDashboard;