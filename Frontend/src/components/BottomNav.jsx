import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import API from "../utils/api";
import '../styles/bottom-nav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');

  useEffect(() => {
    let isMounted = true;
    API.get("/api/auth/me")
      .then((res) => {
        if (isMounted && res.data?.user?.role) {
          setRole(res.data.user.role);
        }
      })
      .catch(() => {
        // If not authenticated or error, leave as default
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (role === 'food-partner') {
        await API.get("/api/auth/food-partner/logout");
        navigate("/food-partner/login");
      } else {
        await API.get("/api/auth/user/logout");
        navigate("/user/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
    }
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom">
      <div className="bottom-nav__inner">
        <NavLink to="/home" end className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">
            {/* home icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5"/>
              <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>
            </svg>
          </span>
          <span className="bottom-nav__label">Home</span>
        </NavLink>

        <NavLink to="/saved" className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
          <span className="bottom-nav__icon" aria-hidden="true">
            {/* bookmark icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>
            </svg>
          </span>
          <span className="bottom-nav__label">Saved</span>
        </NavLink>

        {role === 'food-partner' ? (
          <NavLink to="/food-partner/dashboard" className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
            <span className="bottom-nav__icon" aria-hidden="true">
              {/* layout dashboard icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/>
                <rect width="7" height="5" x="14" y="3" rx="1"/>
                <rect width="7" height="9" x="14" y="12" rx="1"/>
                <rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
            </span>
            <span className="bottom-nav__label">Dashboard</span>
          </NavLink>
        ) : (
          <NavLink to="/orders" className={({ isActive }) => `bottom-nav__item ${isActive ? 'is-active' : ''}`}>
            <span className="bottom-nav__icon" aria-hidden="true">
              {/* shopping bag icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </span>
            <span className="bottom-nav__label">Orders</span>
          </NavLink>
        )}

        <button onClick={handleLogout} className="bottom-nav__item bottom-nav__logout" title="Logout">
          <span className="bottom-nav__icon" aria-hidden="true">
            {/* logout icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="bottom-nav__label">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
