import React, { useEffect, useState } from 'react';
import '../../styles/reels.css';
import API from "../../utils/api";
import ReelFeed from '../../components/ReelFeed';

const Saved = () => {
    const [videos, setVideos] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                // Fetch current user ID and saved items in parallel
                const [userRes, savedRes] = await Promise.all([
                    API.get("/api/auth/me"),
                    API.get("/api/food/save"),
                ]);

                const userId = userRes.data.user._id;
                setCurrentUserId(userId);
                const role = userRes.data.user.role || 'user';
                setCurrentUserRole(role);

                const savedFoods = (savedRes.data.savedFoods || []).map((item) => ({
                    _id: item.food._id,
                    video: item.food.video,
                    description: item.food.description,
                    name: item.food.name,
                    likeCount: item.food.likeCount,
                    savesCount: item.food.savesCount,
                    commentsCount: item.food.commentsCount,
                    foodPartner: item.food.foodPartner,
                    likes: item.food.likes || [],
                    saves: item.food.saves || [],
                    // All items on this page are saved by definition
                    isSaved: true,
                    // Use backend pre-calculated field or derive from likes[] array
                    isLiked: item.food.isLiked !== undefined
                        ? Boolean(item.food.isLiked)
                        : (Array.isArray(item.food.likes) && item.food.likes.map(String).includes(String(userId))),
                }));

                setVideos(savedFoods);
            } catch (error) {
                console.error("Error fetching saved videos:", error);
            }
        };

        fetchSaved();
    }, []);

    // Like/Unlike — same logic as Home.jsx
    const likeVideo = async (item) => {
        try {
            const response = await API.post("/api/food/like", { foodId: item._id });
            const nowLiked = response.data.like;
            const serverLikeCount = response.data.likeCount;

            setVideos((prev) =>
                prev.map((v) =>
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

    // Save/Unsave
    const removeSaved = async (item) => {
        try {
            const response = await API.post("/api/food/save", { foodId: item._id });
            const nowSaved = response.data.save;
            const serverSavesCount = response.data.savesCount;

            setVideos((prev) =>
                prev.map((v) =>
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
            console.error("Save/unsave error:", error);
        }
    };

    const deleteReel = (reelId) => {
        setVideos((prev) => prev.filter((v) => v._id !== reelId));
    };

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={removeSaved}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onDeleteReel={deleteReel}
            emptyMessage="No saved videos yet."
        />
    );
};

export default Saved;
