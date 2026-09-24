import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';
import API from "../../utils/api";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const UserRegister = () => {

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        let newErrors = {};

        const firstName = e.target.firstName.value.trim();
        const lastName = e.target.lastName.value.trim();
        const email = e.target.email.value.trim();
        const password = e.target.password.value.trim();

        if (!firstName) newErrors.firstName = "First name is required";
        if (!lastName) newErrors.lastName = "Last name is required";

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

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await API.post("/api/auth/user/register", {
                fullName: firstName + " " + lastName,
                email,
                password
            });

            console.log(response.data);
            navigate("/home");

        } catch (error) {
            if (error.response) {
                setErrors({ form: error.response.data.message });
            } else {
                setErrors({ form: "Server not responding" });
            }
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card" role="region" aria-labelledby="user-register-title">
                <header>
                    <h1 id="user-register-title" className="auth-title">👤 Customer Sign Up</h1>
                    <p className="auth-subtitle">Join to explore and enjoy delicious meals.</p>
                </header>

                <div className="auth-alt-action" style={{ marginTop: '-4px', marginBottom: '16px' }}>
                    Are you a Food Partner? <Link to="/food-partner/register">🏪 Partner Sign Up →</Link>
                </div>

                {errors.form && <div className="error-text" style={{marginBottom: '10px'}}>{errors.form}</div>}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="two-col">
                        <div className="field-group">
                            <label htmlFor="firstName">First Name</label>
                            <input id="firstName" name="firstName" placeholder="Jane" style={errors.firstName ? {border: '1px solid #f43f5e'} : {}} />
                            {errors.firstName && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.firstName}</span>}
                        </div>

                        <div className="field-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input id="lastName" name="lastName" placeholder="Doe" style={errors.lastName ? {border: '1px solid #f43f5e'} : {}} />
                            {errors.lastName && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.lastName}</span>}
                        </div>
                    </div>

                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" placeholder="you@example.com" style={errors.email ? {border: '1px solid #f43f5e'} : {}} />
                        {errors.email && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.email}</span>}
                    </div>

                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="••••••••" style={errors.password ? {border: '1px solid #f43f5e'} : {}} />
                        {errors.password && <span style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}>{errors.password}</span>}
                    </div>

                    <button className="auth-submit" type="submit">Sign Up</button>
                </form>

                <div className="auth-alt-action">
                    Already have an account? <Link to="/user/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default UserRegister;