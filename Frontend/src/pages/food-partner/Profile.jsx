import React, { useState, useEffect } from 'react';
import '../../styles/profile.css';
import { useParams } from 'react-router-dom';
import API from "../../utils/api";
import logo from "../../assets/logo.png";

const Profile = () => {
    const { id } = useParams();

    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await API.get(`/api/food/food-partner/${id}`);

                setProfile(response.data.foodPartner);
                setVideos(response.data.foodPartner.foodItems || []);

            } catch (error) {
                console.error("Profile fetch error:", error);
            }
        };

        fetchProfile();
    }, [id]);

    return (
        <main className="profile-page">
            <section className="profile-header">
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

            <section className="profile-grid">
                {videos.map((v) => (
                    <div key={v._id} className="profile-grid-item">
                        <video
                            className="profile-grid-video"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            src={
                                v.video?.startsWith('http')
                                    ? v.video
                                    : `https://ik.imagekit.io/yrluxyi6l/${v.video}`
                            }
                            muted
                        />
                    </div>
                ))}
            </section>
        </main>
    );
};

export default Profile;