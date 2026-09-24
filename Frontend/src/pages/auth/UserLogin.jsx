import React, { useState } from 'react';
import '../../styles/auth-shared.css';
import API from "../../utils/api";
import { useNavigate, Link } from 'react-router-dom';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const UserLogin = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    let newErrors = {};

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await API.post("/api/auth/user/login", {
        email,
        password
      });

      console.log(response.data);

      navigate("/home"); // Redirect to home after login
    } catch (error) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || "Login failed. Please check your credentials.";
      setErrors({ form: message });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="user-login-title">
        <header>
          <h1 id="user-login-title" className="auth-title">👤 Customer Login</h1>
          <p className="auth-subtitle">Sign in to browse and order delicious meals.</p>
        </header>

        <div className="auth-alt-action" style={{ marginTop: '-4px', marginBottom: '16px' }}>
          Are you a Food Partner? <Link to="/food-partner/login">🏪 Partner Login →</Link>
        </div>

        {errors.form && <div className="error-text" style={{marginBottom: '10px'}}>{errors.form}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" style={errors.email ? {border: '1px solid #f43f5e'} : {}} />
            {errors.email && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.email}</span>}
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" style={errors.password ? {border: '1px solid #f43f5e'} : {}} />
            {errors.password && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.password}</span>}
          </div>
          <button className="auth-submit" type="submit">Sign In</button>
        </form>
        <div className="auth-alt-action">
          New customer? <Link to="/user/register">Create Customer Account</Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
