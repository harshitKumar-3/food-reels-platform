import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import '../../styles/profile.css';
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

    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const fetchFoodPartnerData = async (attempt = 1) => {
            try {
                const profileResponse = await API.get("/api/auth/food-partner/profile");

                if (!isMounted) return;

                const currentPartner = profileResponse.data.foodPartner;
                setFoodPartner(currentPartner);

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

        return () => {
            isMounted = false;
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