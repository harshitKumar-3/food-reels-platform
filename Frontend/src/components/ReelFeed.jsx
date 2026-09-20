import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

const ReelFeed = ({
  items = [],
  onLike,
  onSave,
  emptyMessage = 'No videos yet.'
}) => {
  const videoRefs = useRef(new Map());

  const [activeCommentFoodId, setActiveCommentFoodId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

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
      {
        threshold: [0, 0.25, 0.6, 0.9, 1]
      }
    );

    videoRefs.current.forEach((vid) => observer.observe(vid));

    return () => observer.disconnect();
  }, [items]);

  const setVideoRef = (id) => (el) => {
    if (!el) {
      videoRefs.current.delete(id);
      return;
    }

    videoRefs.current.set(id, el);
  };

  const openComments = async (foodId) => {
    setActiveCommentFoodId(foodId);
    setCommentText('');
    setCommentError('');
    setLoadingComments(true);

    try {
      const response = await API.get(`/api/food/comments/${foodId}`);

      setComments((prev) => ({
        ...prev,
        [foodId]: response.data.comments || []
      }));
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
        [activeCommentFoodId]: [
          newComment,
          ...(prev[activeCommentFoodId] || [])
        ]
      }));

      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      setCommentError(
        error?.response?.data?.message || 'Unable to post comment.'
      );
    } finally {
      setPostingComment(false);
    }
  };

  const activeComments = activeCommentFoodId
    ? comments[activeCommentFoodId] || []
    : [];

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list">

        {items.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}

        {items.map((item) => {
          const foodPartner = item.foodPartner;
          const foodPartnerId =
            foodPartner?._id || foodPartner;

          const currentComments = comments[item._id];
          const commentCount =
            currentComments?.length ??
            item.commentsCount ??
            0;

          return (
            <section
              key={item._id}
              className="reel"
              role="listitem"
            >
              <video
                ref={setVideoRef(item._id)}
                className="reel-video"
                src={
                  item.video?.startsWith('http')
                    ? item.video
                    : `https://ik.imagekit.io/yrluxyi6l/${item.video}`
                }
                muted
                playsInline
                loop
                preload="metadata"
              />

              <div className="reel-overlay">

                <div
                  className="reel-overlay-gradient"
                  aria-hidden="true"
                />

                <div className="reel-actions">

                  {/* Like */}
                  <div className="reel-action-group">
                    <button
                      onClick={
                        onLike
                          ? () => onLike(item)
                          : undefined
                      }
                      className="reel-action"
                      aria-label="Like"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                    </button>

                    <div className="reel-action__count">
                      {item.likeCount ??
                        item.likesCount ??
                        item.likes ??
                        0}
                    </div>
                  </div>

                  {/* Save */}
                  <div className="reel-action-group">
                    <button
                      className="reel-action"
                      onClick={
                        onSave
                          ? () => onSave(item)
                          : undefined
                      }
                      aria-label="Bookmark"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                      </svg>
                    </button>

                    <div className="reel-action__count">
                      {item.savesCount ??
                        item.bookmarks ??
                        item.saves ??
                        0}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="reel-action-group">
                   <button
                        type="button"
                        className="reel-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          openComments(item._id);
                        }}
                        aria-label="Comments"
                      >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                      </svg>
                    </button>

                    <div className="reel-action__count">
                      {commentCount}
                    </div>
                  </div>

                </div>

                <div className="reel-content">

                  {/* Food Partner Name */}
                  {foodPartner?.name && (
                    <p className="reel-partner-name">
                      {foodPartner.name}
                    </p>
                  )}

                  {/* Food Description */}
                  <p
                    className="reel-description"
                    title={item.description}
                  >
                    {item.description}
                  </p>

                  {/* Visit Store */}
                  {foodPartnerId && (
                    <Link
                      className="reel-btn"
                      to={`/food-partner/${foodPartnerId}`}
                      aria-label="Visit store"
                    >
                      Visit store
                    </Link>
                  )}

                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Comments Modal */}
      {activeCommentFoodId && (
        <div
          className="comments-modal"
          onClick={closeComments}
        >
          <div
            className="comments-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="comments-header">
              <h2>Comments</h2>

              <button
                className="comments-close"
                onClick={closeComments}
                aria-label="Close comments"
              >
                ×
              </button>
            </div>

            <div className="comments-list">
              {loadingComments ? (
                <p className="comments-status">
                  Loading comments...
                </p>
              ) : activeComments.length === 0 ? (
                <p className="comments-status">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                activeComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="comment-item"
                  >
                    <div className="comment-user">
                      {comment.user?.fullName || 'User'}
                    </div>

                    <div className="comment-text">
                      {comment.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {commentError && (
              <p className="comment-error">
                {commentError}
              </p>
            )}

            <form
              className="comment-form"
              onSubmit={submitComment}
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
              />

              <button
                type="submit"
                disabled={
                  postingComment || !commentText.trim()
                }
              >
                {postingComment ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelFeed;