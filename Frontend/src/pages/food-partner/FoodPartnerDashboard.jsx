import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import socket from '../../utils/socket';
import '../../styles/profile.css';
import '../../styles/orders.css';
import ReelGrid from '../../components/ReelGrid';
import ReelViewer from '../../components/ReelViewer';
import logo from "../../assets/logo.png";

const FoodPartnerDashboard = () => {
    const [foodPartner, setFoodPartner] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [totalMeals, setTotalMeals] = useState(0);
    const [loading, setLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedReelIndex, setSelectedReelIndex] = useState(0);

    // ─── Order management state ───────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [statusUpdating, setStatusUpdating] = useState({}); // { [orderId]: true/false }
    const [statusError, setStatusError] = useState({});       // { [orderId]: errorMsg }

    const navigate = useNavigate();

    // ─── Fetch partner orders ─────────────────────────────────────────────────
    const fetchPartnerOrders = async () => {
        try {
            const res = await API.get('/api/orders/partner');
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error('Error fetching partner orders:', err);
        }
    };

    // ─── Update order status ──────────────────────────────────────────────────
    const handleUpdateStatus = async (orderId, newStatus) => {
        setStatusUpdating((prev) => ({ ...prev, [orderId]: true }));
        setStatusError((prev) => ({ ...prev, [orderId]: '' }));
        try {
            const res = await API.patch(`/api/orders/${orderId}/status`, { status: newStatus });
            const updated = res.data.order;
            setOrders((prev) =>
                prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o))
            );
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update order status.';
            setStatusError((prev) => ({ ...prev, [orderId]: msg }));
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

                const mappedFoodItems = partnerFoodItems.map((item) => ({
                    ...item,
                    foodPartner: item.foodPartner && typeof item.foodPartner === 'object'
                        ? item.foodPartner
                        : { _id: currentPartner?._id, name: currentPartner?.name, address: currentPartner?.address },
                    isLiked: item.isLiked !== undefined
                        ? Boolean(item.isLiked)
                        : (Array.isArray(item.likes) && currentPartner?._id
                            ? item.likes.map(String).includes(String(currentPartner._id))
                            : false),
                    isSaved: item.isSaved !== undefined
                        ? Boolean(item.isSaved)
                        : (Array.isArray(item.saves) && currentPartner?._id
                            ? item.saves.map(String).includes(String(currentPartner._id))
                            : false),
                }));

                setFoodItems(mappedFoodItems);
                setTotalMeals(mappedFoodItems.length);
                setLoading(false);

            } catch (error) {
                console.error("Dashboard error:", error);

                const status = error?.response?.status;

                if (attempt < 2) {
                    setTimeout(() => fetchFoodPartnerData(attempt + 1), 500);
                    return;
                }

                if (status === 401 || status === 403) {
                    
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

    const likeVideo = async (item) => {
        try {
            const response = await API.post("/api/food/like", { foodId: item._id });
            const nowLiked = response.data.like;
            const serverLikeCount = response.data.likeCount;
            setFoodItems(prev => prev.map(v => v._id === item._id ? {
                ...v,
                isLiked: nowLiked,
                likeCount: serverLikeCount !== undefined
                    ? serverLikeCount
                    : (nowLiked ? (v.likeCount || 0) + 1 : Math.max(0, (v.likeCount || 0) - 1)),
                likes: nowLiked
                    ? [...(v.likes || []), foodPartner?._id]
                    : (v.likes || []).filter(id => String(id) !== String(foodPartner?._id))
            } : v));
        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const saveVideo = async (item) => {
        try {
            const response = await API.post("/api/food/save", { foodId: item._id });
            const nowSaved = response.data.save;
            const serverSavesCount = response.data.savesCount;
            setFoodItems(prev => prev.map(v => v._id === item._id ? {
                ...v,
                isSaved: nowSaved,
                savesCount: serverSavesCount !== undefined
                    ? serverSavesCount
                    : (nowSaved ? (v.savesCount || 0) + 1 : Math.max(0, (v.savesCount || 0) - 1)),
                saves: nowSaved
                    ? [...(v.saves || []), foodPartner?._id]
                    : (v.saves || []).filter(id => String(id) !== String(foodPartner?._id))
            } : v));
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const deleteReel = (reelId) => {
        setFoodItems(prev => prev.filter(v => String(v._id) !== String(reelId)));
        setViewerOpen(false); // close the viewer when the open reel is deleted
        setTotalMeals(prev => Math.max(0, prev - 1));
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Delivered': return 'order-status-badge order-status-badge--delivered';
            case 'Cancelled': return 'order-status-badge order-status-badge--cancelled';
            case 'Placed':    return 'order-status-badge order-status-badge--placed';
            case 'Preparing':
            default:          return 'order-status-badge order-status-badge--preparing';
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="orders-loading">Loading your dashboard…</div>
            </div>
        );
    }

    const totalLikes = foodItems.reduce((sum, item) => sum + (item.likeCount || 0), 0);

    return (
        <div className="profile-page">
            {/* ─── Profile header ──────────────────────────────────────────── */}
            <section className="profile-header">
                <div className="profile-meta">
                    <img
                        className="profile-avatar"
                        src={logo}
                        alt="Restaurant"
                    />

                    <div className="profile-info">
                        <h1 className="profile-pill profile-business">
                            {foodPartner?.name}
                        </h1>
                        <p className="profile-pill profile-address">
                            {foodPartner?.address}
                        </p>
                        <p className="profile-pill profile-address">
                            📞 {foodPartner?.phone}
                        </p>
                        <p className="profile-pill profile-address">
                            ✉️ {foodPartner?.email}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="profile-stat-label">Total Meals</span>
                        <span className="profile-stat-value">{totalMeals}</span>
                    </div>
                    <div className="profile-stat">
                        <span className="profile-stat-label">Total Likes</span>
                        <span className="profile-stat-value">{totalLikes}</span>
                    </div>
                </div>
            </section>

            {/* ─── Action buttons ──────────────────────────────────────────── */}
            <div className="profile-header" style={{ padding: '16px 24px' }}>
                <div className="dashboard-actions">
                    <button
                        className="dashboard-btn-primary"
                        onClick={() => navigate('/create-food')}
                    >
                        + Create Food Reel
                    </button>
                    <button
                        className="dashboard-btn-secondary"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <hr className="profile-sep" />

            {/* ─── Incoming Orders Section ─────────────────────────────────── */}
            <div className="dashboard-orders-section">
                <h2 className="dashboard-section-title">
                    Incoming Orders
                    <span className="dashboard-section-count">{orders.length}</span>
                </h2>

                {orders.length === 0 ? (
                    <div className="dashboard-orders-empty">
                        No orders yet. Orders placed by customers will appear here in real time.
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => {
                            const food = order.food || {};
                            const customer = order.user || {};
                            const isUpdating = !!statusUpdating[order._id];
                            const dateStr = order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString([], {
                                    month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })
                                : '';

                            return (
                                <div key={order._id} className="order-card">
                                    {/* Header: food name + status badge */}
                                    <div className="order-card-header">
                                        <div>
                                            <div className="order-card-food-name">
                                                {food.name || 'Food Item'}
                                            </div>
                                            <div className="order-card-partner-name">
                                                Customer: {customer.fullName || customer.email || 'Unknown'}
                                            </div>
                                        </div>
                                        <span className={getStatusBadgeClass(order.status)}>
                                            {order.status}
                                        </span>
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

                                    {/* Status action buttons */}
                                    {order.status === 'Placed' && (
                                        <div className="order-card-actions">
                                            <button
                                                className="order-action-btn order-action-btn--prepare"
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                                            >
                                                {isUpdating ? 'Updating…' : '🍳 Mark as Preparing'}
                                            </button>
                                        </div>
                                    )}

                                    {order.status === 'Preparing' && (
                                        <div className="order-card-actions">
                                            <button
                                                className="order-action-btn order-action-btn--deliver"
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                                            >
                                                {isUpdating ? 'Updating…' : '✓ Mark Delivered'}
                                            </button>
                                            <button
                                                className="order-action-btn order-action-btn--cancel"
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                                            >
                                                {isUpdating ? 'Updating…' : '✕ Cancel Order'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Inline error if status update failed */}
                                    {statusError[order._id] && (
                                        <p className="order-card-error">{statusError[order._id]}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            <hr className="profile-sep" />

            {/* ─── Food Reels Section ───────────────────────────────────────── */}
            <div style={{ padding: '0 20px' }}>
                <h2 className="dashboard-section-title">
                    Your Food Reels
                    <span className="dashboard-section-count">{foodItems.length}</span>
                </h2>

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
                    onLike={likeVideo}
                    onSave={saveVideo}
                    currentUserId={foodPartner?._id}
                    currentUserRole="food-partner"
                    onDeleteReel={deleteReel}
                />
            )}
        </div>
    );
};

export default FoodPartnerDashboard;
