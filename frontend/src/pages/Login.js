import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (
      storedUser &&
      form.email === storedUser.email &&
      form.password === storedUser.password
    ) {
      setError("");
      localStorage.setItem("loggedInUser", JSON.stringify(storedUser));
      window.dispatchEvent(new Event("userChanged"));
      navigate("/");
    } else {
      setError("Invalid email or password");
    }
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

            <h1>Welcome<br /><span>Back</span></h1>
            <p>Sign in to continue comparing prices across platforms instantly.</p>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Real-time price tracking
              </div>
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Amazon, Flipkart & Myntra
              </div>
              <div className="auth-feature">
                <div className="auth-feature-dot" />
                Smart deal recommendations
              </div>
            </div>
          </div>

          <div className="auth-stat">
            <div className="auth-stat-pill">
              <strong>3</strong> platforms compared simultaneously
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <h2>Sign In</h2>
          <p className="subtitle">Enter your credentials to access your account</p>

          {error && <div className="error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input
                type="email"
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
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button className="btn" type="submit">Sign In →</button>
          </form>

          <p className="switch">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;