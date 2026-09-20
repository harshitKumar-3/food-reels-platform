import React from 'react';
import ReelFeed from './ReelFeed';

// Modal viewer for full-screen reel experience
// Props:
// - items: Array of video items
// - initialIndex: Starting index
// - onClose: () => void
// - onLike: (item) => void
// - onSave: (item) => void
const ReelViewer = ({ items = [], initialIndex = 0, onClose, onLike, onSave }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-bg)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1001,
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          cursor: 'pointer',
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Close"
        aria-label="Close viewer"
      >
        ✕
      </button>

      <ReelFeed
        items={items}
        onLike={onLike}
        onSave={onSave}
        emptyMessage="No reels to display"
      />
    </div>
  );
};

export default ReelViewer;
