import React from "react";
import "../../styles/auth-shared.css";
import API from "../../utils/api";
import { useNavigate } from "react-router-dom";

const FoodPartnerLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const response = await API.post("/api/auth/food-partner/login", {
        email,
        password,
      });

      console.log(response.data);

      navigate("/food-partner/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      alert(message);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="partner-login-title"
      >
        <header>
          <h1 id="partner-login-title" className="auth-title">
            Partner login
          </h1>
          <p className="auth-subtitle">
            Access your dashboard and manage account
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Admin@gmail.com"
              autoComplete="email"
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="*******"
              autoComplete="current-password"
            />
          </div>

          <button className="auth-submit" type="submit">
            Sign In
          </button>
        </form>

        <div className="auth-alt-action">
          New partner?{" "}
          <a href="/food-partner/register">Create an account</a>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;