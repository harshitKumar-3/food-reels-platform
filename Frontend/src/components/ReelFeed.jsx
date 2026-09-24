import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import OrderModal from './OrderModal';
import '../styles/reels.css';

// ── Inline SVG icons (no extra deps needed) ────────────────────────────────
const TrashIcon = ({ size = 16 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const ReelFeed = ({
  items = [],
  initialIndex = 0,
  onLike,
  onSave,
  currentUserId: propCurrentUserId = null, currentUserRole: propCurrentUserRole = 'user', onDeleteReel,
  emptyMessage = 'No videos yet.'
}) => {
  const [currentUserId, setCurrentUserId] = useState(propCurrentUserId);
  const [currentUserRole, setCurrentUserRole] = useState(propCurrentUserRole);

  useEffect(() => {
    if (propCurrentUserId) setCurrentUserId(propCurrentUserId);
  }, [propCurrentUserId]);

  useEffect(() => {
    if (propCurrentUserRole) setCurrentUserRole(propCurrentUserRole);
  }, [propCurrentUserRole]);

  // Ensure current user ID and role are always available even if parent prop was initially null
  useEffect(() => {
    if (!currentUserId) {
      API.get("/api/auth/me")
        .then((res) => {
          if (res.data?.user?._id) {
            setCurrentUserId(String(res.data.user._id));
            setCurrentUserRole(res.data.user.role || 'user');
          }
        })
        .catch(() => {});
    }
  }, [currentUserId]);

  const videoRefs = useRef(new Map());

  // ── Comments state ────────────────────────────────────────────────────────
  const [activeCommentFoodId, setActiveCommentFoodId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // ── Custom delete-confirmation modal state ────────────────────────────────
  // pendingDelete = { commentId, foodId } | null
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Custom reel delete state ─────────────────────────────────────────────
  const [pendingReelDelete, setPendingReelDelete] = useState(null);
  const [deletingReel, setDeletingReel] = useState(false);
  const [reelDeleteError, setReelDeleteError] = useState('');

  // ── Toast notification state ─────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // ── Order modal state ─────────────────────────────────────────────────────
  const [orderFood, setOrderFood] = useState(null);

  // ── Like/Save animation state ─────────────────────────────────────────────
  const [popping, setPopping] = useState({});

  // ── Video auto-play via IntersectionObserver ──────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!(video instanceof HTMLVideoElement)) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] }
    );

    videoRefs.current.forEach((vid) => observer.observe(vid));
    return () => observer.disconnect();
  }, [items]);

  // Scroll to initial index if specified
  useEffect(() => {
    if (initialIndex > 0 && items[initialIndex]) {
      const targetId = items[initialIndex]._id;
      const el = videoRefs.current.get(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [initialIndex, items]);

  // Escape key closes confirmation modals
  useEffect(() => {
    if (!pendingDelete && !pendingReelDelete) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (pendingDelete) cancelDelete();
        if (pendingReelDelete) cancelReelDelete();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingDelete, pendingReelDelete]);

  const setVideoRef = (id) => (el) => {
    if (!el) { videoRefs.current.delete(id); return; }
    videoRefs.current.set(id, el);
  };

  // ── Pop animation helper ──────────────────────────────────────────────────
  const triggerPop = (key) => {
    setPopping((prev) => ({ ...prev, [key]: true }));
    setTimeout(
      () => setPopping((prev) => { const next = { ...prev }; delete next[key]; return next; }),
      350
    );
  };

  // ── Comments ──────────────────────────────────────────────────────────────
  const openComments = async (foodId) => {
    setActiveCommentFoodId(foodId);
    setCommentText('');
    setCommentError('');
    setLoadingComments(true);
    try {
      const response = await API.get(`/api/food/comments/${foodId}`);
      setComments((prev) => ({ ...prev, [foodId]: response.data.comments || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentError('Unable to load comments.');
    } finally {
      setLoadingComments(false);
    }
  };

  const closeComments = () => {
    setActiveCommentFoodId(null);
    setCommentText('');
    setCommentError('');
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentFoodId) return;
    setPostingComment(true);
    setCommentError('');
    try {
      const response = await API.post('/api/food/comments', {
        foodId: activeCommentFoodId,
        text: commentText.trim()
      });
      const newComment = response.data.comment;
      setComments((prev) => ({
        ...prev,
        [activeCommentFoodId]: [newComment, ...(prev[activeCommentFoodId] || [])]
      }));
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setCommentError(error?.response?.data?.message || 'Unable to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  // ── Comment delete — custom modal flow ────────────────────────────────────
  // Step 1: user clicks trash → open the confirmation modal
  const requestDelete = (comment) => {
    // Store the commentId and the foodId (active modal's food) for later
    setPendingDelete({
      commentId: comment._id,
      foodId: activeCommentFoodId,   // capture now — this is the correct state key
    });
    setDeleteError('');
  };

  // Step 2: user clicks Cancel in the confirmation modal
  const cancelDelete = () => {
    if (deletingInProgress) return; // don't close while deleting
    setPendingDelete(null);
    setDeleteError('');
  };

  // Step 3: user clicks Delete in the confirmation modal
  const confirmDelete = async () => {
    if (!pendingDelete || deletingInProgress) return;
    setDeletingInProgress(true);
    setDeleteError('');
    try {
      await API.delete(`/api/food/comments/${pendingDelete.commentId}`);
      // Remove comment from local state
      setComments((prev) => ({
        ...prev,
        [pendingDelete.foodId]: (prev[pendingDelete.foodId] || []).filter(
          (c) => String(c._id) !== String(pendingDelete.commentId)
        )
      }));
      // Close the confirmation modal
      setPendingDelete(null);
      showToast('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      const msg = error?.response?.data?.message || 'Failed to delete comment. Please try again.';
      setDeleteError(msg);
    } finally {
      setDeletingInProgress(false);
    }
  };

  // ── Reel Delete Flow ──────────────────────────────────────────────────────
  const requestReelDelete = (e, reelId) => {
    e.stopPropagation();
    setPendingReelDelete(reelId);
    setReelDeleteError('');
  };

  const cancelReelDelete = () => {
    if (deletingReel) return;
    setPendingReelDelete(null);
    setReelDeleteError('');
  };

  const confirmReelDelete = async () => {
    if (!pendingReelDelete || deletingReel) return;
    setDeletingReel(true);
    setReelDeleteError('');
    try {
      await API.delete(`/api/food/${pendingReelDelete}`);
      const deletedId = pendingReelDelete;
      setPendingReelDelete(null);
      if (onDeleteReel) {
        onDeleteReel(deletedId);
      }
      showToast('Food reel deleted successfully');
    } catch (error) {
      console.error('Error deleting reel:', error);
      const msg = error?.response?.data?.message || 'Failed to delete reel. Please try again.';
      setReelDeleteError(msg);
    } finally {
      setDeletingReel(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const isOwnComment = (comment) => {
    if (!currentUserId || !comment) return false;
    const commentUserId = comment.user?._id
      ? String(comment.user._id)
      : (comment.user?.id ? String(comment.user.id) : (comment.user ? String(comment.user) : null));
    return Boolean(commentUserId && String(commentUserId) === String(currentUserId));
  };

  const activeComments = activeCommentFoodId ? comments[activeCommentFoodId] || [] : [];

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list">

        {items.length === 0 && (
          <div className="empty-state"><p>{emptyMessage}</p></div>
        )}

        {items.map((item) => {
          const foodPartner = item.foodPartner;
          const foodPartnerId = foodPartner?._id
            ? String(foodPartner._id)
            : (foodPartner ? String(foodPartner) : null);
          const currentComments = comments[item._id];
          const commentCount = currentComments?.length ?? item.commentsCount ?? 0;

          return (
            <section key={item._id} className="reel" role="listitem">
              <video
                ref={setVideoRef(item._id)}
                className="reel-video"
                src={
                  item.video?.startsWith('http')
                    ? item.video
                    : `https://ik.imagekit.io/yrluxyi6l/${item.video}`
                }
                muted playsInline loop preload="metadata"
              />

              <div className="reel-overlay">
                <div className="reel-overlay-gradient" aria-hidden="true" />

                {/* Right-side action buttons */}
                <div className="reel-actions">

                  {/* Like */}
                  <div className="reel-action-group">
                    <button
                      type="button"
                      onClick={onLike ? () => { triggerPop(`${item._id}-like`); onLike(item); } : undefined}
                      className={[
                        'reel-action',
                        item.isLiked ? 'reel-action--liked' : '',
                        popping[`${item._id}-like`] ? 'reel-action--pop' : '',
                      ].filter(Boolean).join(' ')}
                      aria-label={item.isLiked ? 'Unlike' : 'Like'}
                      aria-pressed={!!item.isLiked}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24"
                        fill={item.isLiked ? '#f43f5e' : 'none'}
                        stroke={item.isLiked ? '#f43f5e' : 'currentColor'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    </button>
                    <div className="reel-action__count">{item.likeCount ?? item.likesCount ?? 0}</div>
                  </div>

                  {/* Save */}
                  <div className="reel-action-group">
                    <button
                      type="button"
                      className={[
                        'reel-action',
                        item.isSaved ? 'reel-action--saved' : '',
                        popping[`${item._id}-save`] ? 'reel-action--pop' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={onSave ? () => { triggerPop(`${item._id}-save`); onSave(item); } : undefined}
                      aria-label={item.isSaved ? 'Remove bookmark' : 'Bookmark'}
                      aria-pressed={!!item.isSaved}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24"
                        fill={item.isSaved ? 'var(--color-accent)' : 'none'}
                        stroke={item.isSaved ? 'var(--color-accent)' : 'currentColor'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                      </svg>
                    </button>
                    <div className="reel-action__count">{item.savesCount ?? 0}</div>
                  </div>

                  {/* Comments */}
                  <div className="reel-action-group">
                    <button
                      type="button"
                      className="reel-action"
                      onClick={(e) => { e.stopPropagation(); openComments(item._id); }}
                      aria-label="Comments"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                      </svg>
                    </button>
                    <div className="reel-action__count">{commentCount}</div>
                  </div>

                  {/* Delete Reel (Partner Only) */}
                  {currentUserRole === 'food-partner' && foodPartnerId && currentUserId && String(foodPartnerId) === String(currentUserId) && (
                    <div className="reel-action-group">
                      <button
                        type="button"
                        className="reel-action"
                        onClick={(e) => requestReelDelete(e, item._id)}
                        aria-label="Delete Reel"
                      >
                        <TrashIcon size={20} />
                      </button>
                    </div>
                  )}

                </div>

                {/* Bottom content overlay */}
                <div className="reel-content">
                  {foodPartner?.name && (
                    <p className="reel-partner-name">{foodPartner.name}</p>
                  )}
                  <p className="reel-description" title={item.description}>
                    {item.description}
                  </p>
                  <div className="reel-cta-group">
                    {foodPartnerId && (
                      <Link className="reel-btn reel-btn--secondary"
                        to={`/food-partner/${foodPartnerId}`} aria-label="Visit store">
                        🏪 Visit Store
                      </Link>
                    )}
                    {item._id && currentUserRole === 'user' && (
                      <button type="button" className="reel-btn reel-btn--primary"
                        onClick={(e) => { e.stopPropagation(); setOrderFood(item); }}
                        aria-label="Order now">
                        🛒 Order Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Comments Modal ──────────────────────────────────────────────────── */}
      {activeCommentFoodId && (
        <div className="comments-modal" onClick={closeComments}>
          <div className="comments-panel" onClick={(e) => e.stopPropagation()}>

            <div className="comments-header">
              <h2>Comments</h2>
              <button className="comments-close" onClick={closeComments} aria-label="Close comments">
                ×
              </button>
            </div>

            <div className="comments-list">
              {loadingComments ? (
                <p className="comments-status">Loading comments…</p>
              ) : activeComments.length === 0 ? (
                <p className="comments-status">No comments yet. Be the first!</p>
              ) : (
                activeComments.map((comment) => {
                  const authorName = comment.user?.fullName || 'User';
                  const ownComment = isOwnComment(comment);

                  return (
                    <div key={comment._id} className="comment-item">
                      <div className="comment-avatar" aria-hidden="true">
                        {getInitial(authorName)}
                      </div>
                      <div className="comment-body">
                        <div className="comment-user">{authorName}</div>
                        <div className="comment-text">{comment.text}</div>
                      </div>
                      {/* Trash icon — only for own comments */}
                      {ownComment && (
                        <button
                          type="button"
                          className="comment-delete-btn"
                          onClick={() => requestDelete(comment)}
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {commentError && <p className="comment-error">{commentError}</p>}

            <form className="comment-form" onSubmit={submitComment}>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                maxLength={500}
              />
              <button type="submit" disabled={postingComment || !commentText.trim()}>
                {postingComment ? 'Posting…' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ────────────────────────────────── */}
      {pendingDelete && (
        <div className="delete-confirm-backdrop" onClick={cancelDelete}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            {/* Trash icon */}
            <div className="delete-confirm-icon" aria-hidden="true">
              <TrashIcon size={28} />
            </div>

            <h3 className="delete-confirm-title">Delete comment?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete this comment?<br />
              This action cannot be undone.
            </p>

            {/* In-app error (no alert) */}
            {deleteError && (
              <p className="delete-confirm-error">{deleteError}</p>
            )}

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-btn delete-confirm-btn--cancel"
                onClick={cancelDelete}
                disabled={deletingInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn delete-confirm-btn--delete"
                onClick={confirmDelete}
                disabled={deletingInProgress}
              >
                {deletingInProgress
                  ? <span className="delete-confirm-spinner" />
                  : <><TrashIcon size={14} /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Reel Delete Confirmation Modal ────────────────────────────── */}
      {pendingReelDelete && (
        <div className="delete-confirm-backdrop" onClick={cancelReelDelete}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon" aria-hidden="true">
              <TrashIcon size={28} />
            </div>

            <h3 className="delete-confirm-title">Delete this food reel?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete this food reel?<br />
              This action cannot be undone.
            </p>

            {reelDeleteError && (
              <p className="delete-confirm-error">{reelDeleteError}</p>
            )}

            <div className="delete-confirm-actions">
              <button
                type="button"
                className="delete-confirm-btn delete-confirm-btn--cancel"
                onClick={cancelReelDelete}
                disabled={deletingReel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-confirm-btn delete-confirm-btn--delete"
                onClick={confirmReelDelete}
                disabled={deletingReel}
              >
                {deletingReel
                  ? <span className="delete-confirm-spinner" />
                  : <><TrashIcon size={14} /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Modal ─────────────────────────────────────────────────────── */}
      {orderFood && (
        <OrderModal
          food={orderFood}
          onClose={() => setOrderFood(null)}
          onSuccess={() => {
            setOrderFood(null);
            showToast("Order placed successfully!");
          }}
        />
      )}

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(16, 185, 129, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '9999px',
          fontSize: '14px',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span>✓</span> {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ReelFeed;
