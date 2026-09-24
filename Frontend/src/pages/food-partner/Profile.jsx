import React, { useState, useEffect } from 'react';
import '../../styles/profile.css';
import { useParams, useNavigate } from 'react-router-dom';
import API from "../../utils/api";
import logo from "../../assets/logo.png";
import ReelGrid from '../../components/ReelGrid';
import ReelViewer from '../../components/ReelViewer';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState('user');
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedReelIndex, setSelectedReelIndex] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                let myUserId = null;
                let myRole = 'user';

                try {
                    const userRes = await API.get('/api/auth/me');
                    myUserId = userRes.data?.user?._id;
                    myRole = userRes.data?.user?.role || 'user';
                    if (isMounted) {
                        setCurrentUserId(myUserId);
                        setCurrentUserRole(myRole);
                    }
                } catch {
                    // Non-blocking: unauthenticated users can still view public partner profile
                }

                const response = await API.get(`/api/food/food-partner/${id}`);
                if (!isMounted) return;

                const partner = response.data.foodPartner;
                setProfile(partner);

                const mappedVideos = (partner.foodItems || []).map((item) => ({
                    ...item,
                    foodPartner: item.foodPartner && typeof item.foodPartner === 'object'
                        ? item.foodPartner
                        : { _id: partner._id, name: partner.name, address: partner.address },
                    isLiked: item.isLiked !== undefined
                        ? Boolean(item.isLiked)
                        : (Array.isArray(item.likes) && myUserId ? item.likes.map(String).includes(String(myUserId)) : false),
                    isSaved: item.isSaved !== undefined
                        ? Boolean(item.isSaved)
                        : (Array.isArray(item.saves) && myUserId ? item.saves.map(String).includes(String(myUserId)) : false),
                }));

                setVideos(mappedVideos);

            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [id]);

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

    const saveVideo = async (item) => {
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
            console.error("Save error:", error);
        }
    };

    const deleteReel = (reelId) => {
        setVideos((prev) => prev.filter((v) => v._id !== reelId));
        setViewerOpen(false);
    };

    const handleReelClick = (item) => {
        const index = videos.findIndex((v) => v._id === item._id);
        setSelectedReelIndex(index >= 0 ? index : 0);
        setViewerOpen(true);
    };

    return (
        <main className="profile-page">
            <section className="profile-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => navigate(-1)}
                        style={{ fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        aria-label="Go back"
                    >
                        ← Back
                    </button>
                </div>

                <div className="profile-meta">
                    <img 
                        className="profile-avatar" 
                        src={logo} 
                        alt="profile" 
                    />

                    <div className="profile-info">
                        <h1 className="profile-pill profile-business">
                            {profile?.name}
                        </h1>

                        <p className="profile-pill profile-address">
                            {profile?.address}
                        </p>
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="profile-stat-label">total meals</span>
                        <span className="profile-stat-value">
                            {videos.length}
                        </span>
                    </div>

                    <div className="profile-stat">
                        <span className="profile-stat-label">customer served</span>
                        <span className="profile-stat-value">
                            {profile?.customersServed || 0}
                        </span>
                    </div>
                </div>
            </section>

            <hr className="profile-sep" />

            <div style={{ padding: '0 20px 80px 20px' }}>
                <ReelGrid
                    items={videos}
                    onItemClick={handleReelClick}
                />
            </div>

            {viewerOpen && (
                <ReelViewer
                    items={videos}
                    initialIndex={selectedReelIndex}
                    onClose={() => setViewerOpen(false)}
                    onLike={likeVideo}
                    onSave={saveVideo}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onDeleteReel={deleteReel}
                />
            )}
        </main>
    );
};

export default Profile;