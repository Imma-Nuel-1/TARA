import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_AUTH_STORAGE_KEY = "birthday_admin_auth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setStatus("Please enter both username and password");
      return;
    }

    setLoading(true);
    setStatus("Logging in...");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        ADMIN_AUTH_STORAGE_KEY,
        JSON.stringify({
          username: data.username || username,
          token: data.token,
        }),
      );

      setStatus("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 500);
    } catch (err) {
      setStatus("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "3rem",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#333", fontSize: "2rem" }}>
            Admin Portal
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
            Birthday CMS Dashboard
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="admin-username"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#555",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Username
          </label>
          <input
            id="admin-username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="admin-password"
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#555",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.875rem",
            background: loading ? "#999" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {status && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: status.includes("successful") ? "#d4edda" : "#f8d7da",
              color: status.includes("successful") ? "#155724" : "#721c24",
              borderRadius: "6px",
              fontSize: "0.875rem",
              textAlign: "center",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
