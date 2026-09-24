import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import '../../styles/reels.css';
import ReelFeed from '../../components/ReelFeed';

const Home = () => {
    const [videos, setVideos] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user identity and food items in parallel
                const [userRes, foodRes] = await Promise.all([
                    API.get("/api/auth/me"),
                    API.get("/api/food"),
                ]);

                const userId = userRes.data.user._id;
                // Backend now returns role directly — no guessing needed
                const role = userRes.data.user.role || 'user';
                setCurrentUserId(userId);
                setCurrentUserRole(role);

                // Derive isLiked / isSaved from backend fields or fallback to likes[] / saves[] arrays
                const items = (foodRes.data.foodItems || []).map((item) => ({
                    ...item,
                    isLiked: item.isLiked !== undefined
                        ? Boolean(item.isLiked)
                        : (Array.isArray(item.likes) && item.likes.map(String).includes(String(userId))),
                    isSaved: item.isSaved !== undefined
                        ? Boolean(item.isSaved)
                        : (Array.isArray(item.saves) && item.saves.map(String).includes(String(userId))),
                }));

                setVideos(items);
            } catch (error) {
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    navigate('/');
                } else {
                    console.error('Error fetching videos:', error);
                    // Don't redirect — show empty state so user knows there's a load error
                }
            }
        };

        fetchData();
    }, [navigate]);

    const likeVideo = async (item) => {
        try {
            const response = await API.post("/api/food/like", {
                foodId: item._id
            });

            const nowLiked = response.data.like; // true = just liked, false = unliked
            const serverLikeCount = response.data.likeCount;

            setVideos(prev =>
                prev.map(v =>
                    v._id === item._id
                        ? {
                            ...v,
                            isLiked: nowLiked,
                            likeCount: serverLikeCount !== undefined
                                ? serverLikeCount
                                : (nowLiked ? (v.likeCount || 0) + 1 : Math.max(0, (v.likeCount || 0) - 1)),
                            likes: nowLiked
                                ? [...(v.likes || []), currentUserId]
                                : (v.likes || []).filter(id => String(id) !== String(currentUserId))
                          }
                        : v
                )
            );
        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const saveVideo = async (item) => {
        try {
            const response = await API.post("/api/food/save", {
                foodId: item._id
            });

            const nowSaved = response.data.save; // true = just saved, false = unsaved
            const serverSavesCount = response.data.savesCount;

            setVideos(prev =>
                prev.map(v =>
                    v._id === item._id
                        ? {
                            ...v,
                            isSaved: nowSaved,
                            savesCount: serverSavesCount !== undefined
                                ? serverSavesCount
                                : (nowSaved ? (v.savesCount || 0) + 1 : Math.max(0, (v.savesCount || 0) - 1)),
                            saves: nowSaved
                                ? [...(v.saves || []), currentUserId]
                                : (v.saves || []).filter(id => String(id) !== String(currentUserId))
                          }
                        : v
                )
            );
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const deleteReel = (reelId) => {
        setVideos(prev => prev.filter(v => String(v._id) !== String(reelId)));
    };

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={saveVideo}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDeleteReel={deleteReel}
            emptyMessage="No videos available."
        />
    );
};

export default Home;
