import React, { useEffect, useMemo, useState } from "react";
import "./AdminPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_AUTH_STORAGE_KEY = "birthday_admin_auth";

const emptyPayload = {
  secretCode: "",
  title: "",
  loveLetter: { heading: "", paragraphs: [] },
  playlist: [],
  notes: [],
  gallery: [],
};

const AdminPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("site");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(emptyPayload, null, 2),
  );
  const [pendingItems, setPendingItems] = useState([]);
  const [status, setStatus] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  useEffect(() => {
    const savedAuth = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!savedAuth) {
      return;
    }

    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.token && parsed?.username) {
        setToken(parsed.token);
        setUsername(parsed.username);
        setStatus(`Welcome back, ${parsed.username}.`);
      }
    } catch {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    }
  }, []);

  const login = async () => {
    setStatus("Logging in...");
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Login failed");
      return;
    }

    setToken(data.token);
    setPassword("");
    localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEY,
      JSON.stringify({
        username: data.username || username,
        token: data.token,
      }),
    );
    setStatus("Login successful.");
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setToken("");
    setPendingItems([]);
    setStatus("Logged out.");
  };

  const load = async () => {
    setStatus("Loading content...");
    const res = await fetch(`${API_BASE}/api/admin/site-content`, {
      headers: authHeaders,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Failed to load content");
      return;
    }

    const { singleton, _id, __v, createdAt, updatedAt, ...clean } = data;
    setPayloadText(JSON.stringify(clean, null, 2));
    setStatus("Content loaded.");
  };

  const save = async () => {
    setStatus("Saving content...");
    let parsed;

    try {
      parsed = JSON.parse(payloadText);
    } catch {
      setStatus("Invalid JSON format");
      return;
    }

    const res = await fetch(`${API_BASE}/api/admin/site-content`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(parsed),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.message || "Save failed");
      return;
    }

    setStatus("Saved successfully.");
  };

  const loadPending = async () => {
    setStatus("Loading pending queue...");
    const res = await fetch(`${API_BASE}/api/content?status=pending`, {
      headers: authHeaders,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Failed to load queue");
      return;
    }

    const filtered = data.filter(
      (item) => item.type === "message" || item.type === "image",
    );
    setPendingItems(filtered);
    setStatus(`Loaded ${filtered.length} pending submissions.`);
  };

  const moderate = async (id, action) => {
    setStatus(
      `${action === "approve" ? "Approving" : "Rejecting"} submission...`,
    );
    const route =
      action === "approve"
        ? `${API_BASE}/api/content/${id}/approve`
        : `${API_BASE}/api/content/${id}/reject`;

    const res = await fetch(route, {
      method: "PATCH",
      headers: authHeaders,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus(data.message || "Moderation action failed");
      return;
    }

    setPendingItems((items) => items.filter((item) => item._id !== id));
    setStatus("Moderation action completed.");
  };

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header">
          <h1>Admin CMS Dashboard</h1>
          <p>
            Manage website content and moderate user-submitted messages and
            images.
          </p>
        </header>

        <div className="admin-body">
          <aside className="admin-panel">
            <h2>Authentication</h2>
            <div className="admin-field">
              <label htmlFor="admin-username">Admin Username</label>
              <input
                id="admin-username"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn primary"
                onClick={login}
              >
                Login
              </button>
              <button
                type="button"
                className="admin-btn secondary"
                onClick={logout}
                disabled={!token}
              >
                Logout
              </button>
            </div>
            <p className="admin-status">
              {token ? "Authenticated" : "Not authenticated"}
            </p>
          </aside>

          <section className="admin-main">
            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab ${activeTab === "site" ? "active" : ""}`}
                onClick={() => setActiveTab("site")}
              >
                Site Content
              </button>
              <button
                type="button"
                className={`admin-tab ${activeTab === "moderation" ? "active" : ""}`}
                onClick={() => setActiveTab("moderation")}
              >
                Moderation Queue
              </button>
            </div>

            {activeTab === "site" ? (
              <article className="admin-editor">
                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={load}
                    disabled={!token}
                  >
                    Load Site Content
                  </button>
                  <button
                    type="button"
                    className="admin-btn primary"
                    onClick={save}
                    disabled={!token}
                  >
                    Save Site Content
                  </button>
                </div>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                />
              </article>
            ) : (
              <article className="admin-editor">
                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-btn secondary"
                    onClick={loadPending}
                    disabled={!token}
                  >
                    Refresh Pending Queue
                  </button>
                </div>
                <div className="queue-grid">
                  {pendingItems.length === 0 ? (
                    <p>No pending message/image submissions right now.</p>
                  ) : (
                    pendingItems.map((item) => (
                      <section key={item._id} className="queue-card">
                        <div className="queue-meta">
                          <span className="badge">{item.type}</span>
                          <span className="badge">{item.status}</span>
                          <span className="badge">{item.createdByRole}</span>
                        </div>
                        <h3>{item.title || "Untitled submission"}</h3>
                        {item.type === "message" ? (
                          <p className="queue-preview">
                            {typeof item.data === "string"
                              ? item.data
                              : JSON.stringify(item.data, null, 2)}
                          </p>
                        ) : null}
                        {item.type === "image" ? (
                          <div>
                            {item.data?.url ? (
                              <img
                                src={item.data.url}
                                alt={item.title || "submission"}
                                className="queue-image"
                              />
                            ) : (
                              <p className="queue-preview">
                                {JSON.stringify(item.data, null, 2)}
                              </p>
                            )}
                          </div>
                        ) : null}
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-btn success"
                            onClick={() => moderate(item._id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-btn danger"
                            onClick={() => moderate(item._id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </section>
                    ))
                  )}
                </div>
              </article>
            )}

            <p className="admin-status">{status}</p>
          </section>
        </div>
      </section>
    </main>
  );
};

export default AdminPage;
