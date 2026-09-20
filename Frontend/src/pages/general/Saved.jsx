import React, { useEffect, useState } from 'react';
import '../../styles/reels.css';
import API from "../../utils/api";
import ReelFeed from '../../components/ReelFeed';

const Saved = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const response = await API.get("/api/food/save");

                const savedFoods = response.data.savedFoods.map((item) => ({
                    _id: item.food._id,
                    video: item.food.video,
                    description: item.food.description,
                    likeCount: item.food.likeCount,
                    savesCount: item.food.savesCount,
                    commentsCount: item.food.commentsCount,
                    foodPartner: item.food.foodPartner,
                }));

                setVideos(savedFoods);

            } catch (error) {
                console.error("Error fetching saved videos:", error);
            }
        };

        fetchSaved();
    }, []);

    const removeSaved = async (item) => {
        try {
            await API.post("/api/food/save", { foodId: item._id });

            setVideos((prev) =>
                prev.map((v) =>
                    v._id === item._id
                        ? { ...v, savesCount: Math.max(0, (v.savesCount ?? 1) - 1) }
                        : v
                )
            );

        } catch (error) {
            console.error("Remove save error:", error);
        }
    };

    return (
        <ReelFeed
            items={videos}
            onSave={removeSaved}
            emptyMessage="No saved videos yet."
        />
    );
};

export default Saved;