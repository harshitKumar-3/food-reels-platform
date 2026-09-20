import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import '../../styles/reels.css';
import ReelFeed from '../../components/ReelFeed';

const Home = () => {
    const [videos, setVideos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await API.get("/api/food");
                setVideos(response.data.foodItems);

            } catch (error) {
                const status = error?.response?.status;

                if (status === 401 || status === 403) {
                    navigate('/');
                } else {
                    console.error('Error fetching videos', error);
                }
            }
        };

        fetchVideos();
    }, [navigate]);

    const likeVideo = async (item) => {
        try {
            const response = await API.post("/api/food/like", {
                foodId: item._id
            });

            if (response.data.like) {
                setVideos(prev =>
                    prev.map(v =>
                        v._id === item._id
                            ? { ...v, likeCount: v.likeCount + 1 }
                            : v
                    )
                );
            } else {
                setVideos(prev =>
                    prev.map(v =>
                        v._id === item._id
                            ? { ...v, likeCount: v.likeCount - 1 }
                            : v
                    )
                );
            }

        } catch (error) {
            console.error("Like error:", error);
        }
    };

    const saveVideo = async (item) => {
        try {
            const response = await API.post("/api/food/save", {
                foodId: item._id
            });

            if (response.data.save) {
                setVideos(prev =>
                    prev.map(v =>
                        v._id === item._id
                            ? { ...v, savesCount: v.savesCount + 1 }
                            : v
                    )
                );
            } else {
                setVideos(prev =>
                    prev.map(v =>
                        v._id === item._id
                            ? { ...v, savesCount: v.savesCount - 1 }
                            : v
                    )
                );
            }

        } catch (error) {
            console.error("Save error:", error);
        }
    };

    return (
        <ReelFeed
            items={videos}
            onLike={likeVideo}
            onSave={saveVideo}
            emptyMessage="No videos available."
        />
    );
};

export default Home;