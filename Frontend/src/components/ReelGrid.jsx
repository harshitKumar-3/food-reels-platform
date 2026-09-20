import React from 'react';
import '../styles/profile.css';

// Grid display for reels with thumbnails
// Props:
// - items: Array of video items
// - onItemClick: (item) => void
const ReelGrid = ({ items = [], onItemClick }) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)' }}>
        <p>You haven't created any food reels yet.</p>
        <p>Click "Create New Food" to get started!</p>
      </div>
    );
  }

  return (
    <section className="profile-grid" aria-label="Your reels">
      {items.map((item) => (
        <div
          key={item._id}
          className="profile-grid-item"
          onClick={() => onItemClick(item)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onItemClick(item);
            }
          }}
          style={{ cursor: 'pointer' }}
          title={item.description}
        >
          <video
            className="profile-grid-video"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            src={item.video?.startsWith('http') ? item.video : `https://ik.imagekit.io/yrluxyi6l/${item.video}`}
            muted
          />
        </div>
      ))}
    </section>
  );
};

export default ReelGrid;
