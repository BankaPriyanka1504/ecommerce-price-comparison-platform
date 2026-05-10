import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Object.values(form).includes("")) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const user = {
      name: form.name,
      email: form.email,
      password: form.password
    };

    localStorage.setItem("user", JSON.stringify(user));
    setError("");
    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* LEFT PANEL */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo">
              <div className="auth-logo-icon">🛒</div>
              <span className="auth-logo-name">SmartCompare</span>
            </div>

            <h1>Start<br /><span>Saving</span></h1>
            <p>Join thousands comparing prices to find the best deals every day.</p>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Free to use, always
              </div>
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Instant price comparison
              </div>
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Smart best-deal detection
              </div>
            </div>
          </div>

          <div className="auth-stat">
            <div className="auth-stat-pill">
              <strong>100%</strong> free — no credit card needed
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <h2>Create Account</h2>
          <p className="subtitle">Fill in your details to get started</p>

          {error && <div className="error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button className="btn" type="submit">Create Account →</button>
          </form>

          <p className="switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;