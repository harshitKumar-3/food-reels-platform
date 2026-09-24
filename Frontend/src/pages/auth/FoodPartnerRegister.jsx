import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';
import API from "../../utils/api";
import PhoneInput, { validatePhone } from "../../components/PhoneInput";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const FoodPartnerRegister = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    let newErrors = {};

    const businessName = e.target.businessName.value.trim();
    const contactName = e.target.contactName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    const address = e.target.address.value.trim();

    if (!businessName) newErrors.businessName = "Business name is required";
    if (!contactName) newErrors.contactName = "Contact name is required";
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!address) newErrors.address = "Address is required";

    const [countryCode, ...phoneParts] = phone.split(" ");
    const phoneError = validatePhone(countryCode || '+91', phoneParts.join(" ") || phone);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await API.post("/api/auth/food-partner/register", {
        name: businessName,
        contactName,
        phone,
        email,
        password,
        address
      });

      console.log(response.data);
      navigate("/create-food");

    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.message ||
        "Registration failed. Try again.";
      setErrors({ form: message });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="partner-register-title">
        <header>
          <h1 id="partner-register-title" className="auth-title">🏪 Food Partner Sign Up</h1>
          <p className="auth-subtitle">Grow your restaurant business with our platform.</p>
        </header>

        <div className="auth-alt-action" style={{ marginTop: '-4px', marginBottom: '16px' }}>
          Are you a Customer? <Link to="/user/register">👤 Customer Sign Up →</Link>
        </div>

        {errors.form && <div className="error-text" style={{marginBottom: '10px'}}>{errors.form}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="businessName">Business Name</label>
            <input id="businessName" name="businessName" placeholder="Tasty Bites" style={errors.businessName ? {border: '1px solid #f43f5e'} : {}} />
            {errors.businessName && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.businessName}</span>}
          </div>

          <div className="two-col">
            <div className="field-group">
              <label htmlFor="contactName">Contact Name</label>
              <input id="contactName" name="contactName" placeholder="Jane Doe" style={errors.contactName ? {border: '1px solid #f43f5e'} : {}} />
              {errors.contactName && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.contactName}</span>}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="phone">Phone</label>
            <PhoneInput value={phone} onChange={setPhone} error={errors.phone} />
          </div>

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="business@example.com" style={errors.email ? {border: '1px solid #f43f5e'} : {}} />
            {errors.email && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.email}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Create password" style={errors.password ? {border: '1px solid #f43f5e'} : {}} />
            {errors.password && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.password}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" placeholder="123 Market Street" style={errors.address ? {border: '1px solid #f43f5e'} : {}} />
            {errors.address && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.address}</span>}
            {!errors.address && <p className="small-note">Full address helps customers find you faster.</p>}
          </div>

          <button className="auth-submit" type="submit">
            Create Partner Account
          </button>
        </form>

        <div className="auth-alt-action">
          Already a partner? <Link to="/food-partner/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;