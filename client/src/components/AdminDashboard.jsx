import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_AUTH_STORAGE_KEY = "birthday_admin_auth";
const ACTIVITY_LOG_KEY = "admin_activity_log";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [content, setContent] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approvedMessages: 0,
    approvedImages: 0,
    totalContent: 0,
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityLog, setActivityLog] = useState([]);

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
      navigate("/admin/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(savedAuth);
      if (parsed?.token && parsed?.username) {
        setToken(parsed.token);
        setUsername(parsed.username);
        loadContent(parsed.token);
        loadAllData(parsed.token);
      } else {
        navigate("/admin/login", { replace: true });
      }
    } catch {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      navigate("/admin/login", { replace: true });
    }

    // Load activity log from localStorage
    const savedLog = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (savedLog) {
      try {
        setActivityLog(JSON.parse(savedLog));
      } catch {
        setActivityLog([]);
      }
    }
  }, [navigate]);

  const addToActivityLog = (action, itemTitle, itemType) => {
    const newEntry = {
      id: Date.now(),
      action,
      itemTitle,
      itemType,
      timestamp: new Date().toLocaleString(),
    };

    const updatedLog = [newEntry, ...activityLog].slice(0, 50); // Keep last 50 entries
    setActivityLog(updatedLog);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updatedLog));
  };

  const loadContent = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/site-content`, {
        headers: {
          Authorization: `Bearer ${authToken || token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();

      if (res.ok) {
        setContent(data);
      }
    } catch (err) {
      console.error("Failed to load content:", err);
    }
  };

  const loadAllData = async (authToken) => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${authToken || token}`,
        "Content-Type": "application/json",
      };

      // Load pending
      const pendingRes = await fetch(`${API_BASE}/api/content?status=pending`, {
        headers,
      });
      const pendingData = await pendingRes.json();
      const pending = pendingRes.ok
        ? pendingData.filter((item) => item.type === "message" || item.type === "image")
        : [];
      setPendingItems(pending);

      // Load approved
      const approvedRes = await fetch(`${API_BASE}/api/content?status=approved`, {
        headers,
      });
      const approvedData = await approvedRes.json();
      const approved = approvedRes.ok
        ? approvedData.filter((item) => item.type === "message" || item.type === "image")
        : [];

      // Load published (auto-published posts)
      const publishedRes = await fetch(`${API_BASE}/api/content?status=published`, {
        headers,
      });
      const publishedData = await publishedRes.json();
      const published = publishedRes.ok
        ? publishedData.filter((item) => item.type === "message" || item.type === "image")
        : [];

      // Combine all posts (approved + published)
      const allPosts = [...approved, ...published].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setApprovedItems(allPosts);

      // Calculate stats
      const approvedMessages = allPosts.filter((item) => item.type === "message").length;
      const approvedImages = allPosts.filter((item) => item.type === "image").length;
      const totalContent =
        (content?.playlist?.length || 0) +
        (content?.gallery?.length || 0) +
        (content?.notes?.length || 0) +
        (content?.loveLetter?.paragraphs?.length || 0);

      setStats({
        pending: pending.length,
        approvedMessages,
        approvedImages,
        totalContent,
      });
    } catch (err) {
      console.error("Failed to load data:", err);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    navigate("/admin/login", { replace: true });
  };

  const loadPendingMessages = async () => {
    setLoading(true);
    setStatus("Loading submissions...");
    try {
      const res = await fetch(`${API_BASE}/api/content?status=pending`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        const filtered = data.filter(
          (item) => item.type === "message" || item.type === "image",
        );
        setPendingItems(filtered);
        setStats((prev) => ({ ...prev, pending: filtered.length }));
        setStatus(
          filtered.length > 0
            ? `${filtered.length} pending submissions`
            : "No pending submissions",
        );
      } else {
        setStatus("Failed to load submissions");
      }
    } catch (err) {
      setStatus("Error loading submissions");
    }
    setLoading(false);
  };

  const approveItem = async (id) => {
    const item = pendingItems.find((i) => i._id === id);
    try {
      const res = await fetch(`${API_BASE}/api/content/${id}/approve`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (res.ok) {
        setPendingItems((items) => items.filter((item) => item._id !== id));
        setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
        setStatus("Approved successfully");
        addToActivityLog("Approved", item?.title || "Untitled", item?.type || "item");
      } else {
        setStatus("Failed to approve");
      }
    } catch (err) {
      setStatus("Error approving submission");
    }
  };

  const rejectItem = async (id) => {
    const item = pendingItems.find((i) => i._id === id);
    try {
      const res = await fetch(`${API_BASE}/api/content/${id}/reject`, {
        method: "PATCH",
        headers: authHeaders,
      });

      if (res.ok) {
        setPendingItems((items) => items.filter((item) => item._id !== id));
        setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
        setStatus("Rejected successfully");
        addToActivityLog("Rejected", item?.title || "Untitled", item?.type || "item");
      } else {
        setStatus("Failed to reject");
      }
    } catch (err) {
      setStatus("Error rejecting submission");
    }
  };

  const deleteItem = async (id, source = "approved") => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    const items = source === "approved" ? approvedItems : pendingItems;
    const item = items.find((i) => i._id === id);
    
    try {
      const res = await fetch(`${API_BASE}/api/content/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (res.ok) {
        if (source === "approved") {
          setApprovedItems((items) => items.filter((item) => item._id !== id));
        } else {
          setPendingItems((items) => items.filter((item) => item._id !== id));
        }
        setStatus("Post deleted successfully");
        addToActivityLog("Deleted", item?.title || "Untitled", item?.type || "item");
      } else {
        setStatus("Failed to delete");
      }
    } catch (err) {
      setStatus("Error deleting post");
    }
  };

  useEffect(() => {
    if (activeTab === "moderation" && token) {
      loadPendingMessages();
    }
    if ((activeTab === "posts" || activeTab === "dashboard") && token) {
      loadAllData(token);
    }
  }, [activeTab, token]);

  // Filter and search logic
  const filteredItems = pendingItems.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "messages" && item.type === "message") ||
      (filter === "images" && item.type === "image");

    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.data === "string" &&
        item.data.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Top Navigation */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#333" }}>
            Birthday CMS
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              fontSize: "0.875rem",
              color: "#666",
            }}
          >
            Welcome, {username}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "0.5rem 1.5rem",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div style={{ padding: "2rem" }}>
        {/* Tabs */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              borderBottom: "2px solid #e0e0e0",
            }}
          >
            <button
              onClick={() => setActiveTab("dashboard")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "dashboard"
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === "dashboard" ? "#007bff" : "#666",
                fontWeight: activeTab === "dashboard" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("content")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "content"
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === "content" ? "#007bff" : "#666",
                fontWeight: activeTab === "content" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              Website Content
            </button>
            <button
              onClick={() => setActiveTab("moderation")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "moderation"
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === "moderation" ? "#007bff" : "#666",
                fontWeight: activeTab === "moderation" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              Moderation {stats.pending > 0 && `(${stats.pending})`}
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "posts"
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === "posts" ? "#007bff" : "#666",
                fontWeight: activeTab === "posts" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              All Posts
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "activity"
                    ? "3px solid #007bff"
                    : "3px solid transparent",
                color: activeTab === "activity" ? "#007bff" : "#666",
                fontWeight: activeTab === "activity" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              Activity Log
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            minHeight: "500px",
          }}
        >
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div>
              <h2 style={{ marginTop: 0, color: "#333", fontSize: "1.5rem" }}>
                Dashboard Overview
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1.5rem",
                  marginTop: "2rem",
                }}
              >
                {/* Pending Submissions */}
                <div
                  style={{
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {stats.pending}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.9 }}>
                    Pending Submissions
                  </div>
                </div>

                {/* Approved Messages */}
                <div
                  style={{
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {stats.approvedMessages}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.9 }}>
                    Approved Messages
                  </div>
                </div>

                {/* Approved Images */}
                <div
                  style={{
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {stats.approvedImages}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.9 }}>
                    Approved Images
                  </div>
                </div>

                {/* Total Content Items */}
                <div
                  style={{
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {stats.totalContent}
                  </div>
                  <div style={{ fontSize: "1rem", opacity: 0.9 }}>
                    Total Content Items
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginTop: "3rem" }}>
                <h3 style={{ color: "#333", marginBottom: "1rem" }}>Quick Actions</h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveTab("moderation")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    Review Submissions
                  </button>
                  <button
                    onClick={() => loadAllData()}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    Refresh Data
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#6c757d",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  >
                    View Activity Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT TAB */}
          {activeTab === "content" && (
            <div>
              <h2 style={{ marginTop: 0, color: "#333", fontSize: "1.5rem" }}>
                Website Content Overview
              </h2>
              {loading ? (
                <p style={{ color: "#666" }}>Loading...</p>
              ) : content ? (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {/* Title */}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#555",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Page Title
                    </h3>
                    <p style={{ margin: 0, fontSize: "1.125rem", color: "#333" }}>
                      {content.title || "Not set"}
                    </p>
                  </div>

                  {/* Love Letter */}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#555",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Love Letter
                    </h3>
                    <p style={{ margin: "0.5rem 0", fontWeight: "600", color: "#333" }}>
                      {content.loveLetter?.heading || "No heading"}
                    </p>
                    <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
                      {content.loveLetter?.paragraphs?.length || 0} paragraphs
                    </p>
                  </div>

                  {/* Playlist */}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#555",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Birthday Playlist
                    </h3>
                    <p style={{ margin: 0, color: "#666" }}>
                      {content.playlist?.length || 0} songs
                    </p>
                  </div>

                  {/* Gallery */}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#555",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Photo Gallery
                    </h3>
                    <p style={{ margin: 0, color: "#666" }}>
                      {content.gallery?.length || 0} photos
                    </p>
                  </div>

                  {/* Notes */}
                  <div
                    style={{
                      padding: "1rem",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 0.5rem 0",
                        color: "#555",
                        fontSize: "0.875rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Sticky Notes
                    </h3>
                    <p style={{ margin: 0, color: "#666" }}>
                      {content.notes?.length || 0} notes
                    </p>
                  </div>
                </div>
              ) : (
                <p style={{ color: "#666" }}>No content available</p>
              )}
            </div>
          )}

          {/* MODERATION TAB */}
          {activeTab === "moderation" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>
                  Pending Submissions
                </h2>
                <button
                  onClick={loadPendingMessages}
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  Refresh
                </button>
              </div>

              {/* Filters and Search */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setFilter("all")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: filter === "all" ? "#007bff" : "#e9ecef",
                      color: filter === "all" ? "#fff" : "#495057",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("messages")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: filter === "messages" ? "#007bff" : "#e9ecef",
                      color: filter === "messages" ? "#fff" : "#495057",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => setFilter("images")}
                    style={{
                      padding: "0.5rem 1rem",
                      background: filter === "images" ? "#007bff" : "#e9ecef",
                      color: filter === "images" ? "#fff" : "#495057",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Images
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: "1",
                    minWidth: "200px",
                    padding: "0.5rem 1rem",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>

              {status && (
                <p
                  style={{
                    padding: "0.75rem",
                    background: "#e7f3ff",
                    color: "#004085",
                    borderRadius: "4px",
                    marginBottom: "1rem",
                  }}
                >
                  {status}
                </p>
              )}

              {loading ? (
                <p style={{ color: "#666" }}>Loading submissions...</p>
              ) : filteredItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
                  <p style={{ fontSize: "1.125rem" }}>
                    {searchQuery || filter !== "all"
                      ? "No matching submissions"
                      : "No pending submissions"}
                  </p>
                  <p style={{ fontSize: "0.875rem" }}>
                    {searchQuery || filter !== "all"
                      ? "Try adjusting your filters or search"
                      : "All caught up!"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {filteredItems.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        background: "#fafafa",
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: item.type === "message" ? "#007bff" : "#28a745",
                            color: "#fff",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.type}
                        </span>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#6c757d",
                            color: "#fff",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {item.createdByRole}
                        </span>
                      </div>

                      <h3 style={{ margin: "0 0 1rem 0", color: "#333" }}>
                        {item.title || "Untitled"}
                      </h3>

                      {item.type === "message" && (
                        <p
                          style={{
                            margin: "0 0 1.5rem 0",
                            color: "#555",
                            padding: "1rem",
                            background: "#fff",
                            borderRadius: "4px",
                            border: "1px solid #e0e0e0",
                            maxHeight: "150px",
                            overflow: "auto",
                          }}
                        >
                          {typeof item.data === "string"
                            ? item.data
                            : JSON.stringify(item.data)}
                        </p>
                      )}

                      {item.type === "image" && item.data?.url && (
                        <div style={{ marginBottom: "1.5rem" }}>
                          <img
                            src={item.data.url}
                            alt={item.title || "submission"}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "300px",
                              borderRadius: "4px",
                              border: "1px solid #e0e0e0",
                            }}
                          />
                        </div>
                      )}

                      <div
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "6px",
                          background: "#eef7ff",
                          color: "#004085",
                          border: "1px solid #b8daff",
                          fontSize: "0.875rem",
                        }}
                      >
                        Published automatically. No review step is required.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL POSTS TAB */}
          {activeTab === "posts" && (
            <div>
              <h2 style={{ marginTop: 0, color: "#333", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
                All Posts ({approvedItems.length})
              </h2>
              
              {loading ? (
                <p style={{ color: "#666" }}>Loading posts...</p>
              ) : approvedItems.length === 0 ? (
                <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>
                  No posts yet
                </p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {approvedItems.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: "1.25rem",
                        background: "#f9f9f9",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        display: "grid",
                        gridTemplateColumns: item.type === "image" ? "120px 1fr 100px" : "1fr 100px",
                        gap: "1rem",
                        alignItems: "start",
                      }}
                    >
                      {/* Image/Video Thumbnail */}
                      {item.type === "image" && item.data?.url && (
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "6px",
                            overflow: "hidden",
                            background: "#e9ecef",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.data.mediaType === "video" ? (
                            <video
                              src={item.data.url}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <img
                              src={item.data.url}
                              alt={item.data.caption}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Post Details */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.75rem",
                              background:
                                item.type === "message"
                                  ? "#d1ecf1"
                                  : "#d4edda",
                              color:
                                item.type === "message"
                                  ? "#0c5460"
                                  : "#155724",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              textTransform: "uppercase",
                            }}
                          >
                            {item.type}
                          </span>
                          <span style={{ fontSize: "0.875rem", color: "#666" }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "#333", fontSize: "1rem" }}>
                          {item.title}
                        </h4>

                        {item.type === "message" && (
                          <div>
                            <p
                              style={{
                                margin: "0.5rem 0",
                                color: "#555",
                                fontSize: "0.875rem",
                              }}
                            >
                              <strong>From:</strong> {item.createdBy}
                            </p>
                            {item.data?.role && (
                              <p
                                style={{
                                  margin: "0.5rem 0",
                                  color: "#555",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <strong>Relationship:</strong> {item.data.role}
                              </p>
                            )}
                            <p
                              style={{
                                margin: "0.75rem 0 0 0",
                                color: "#666",
                                fontSize: "0.875rem",
                                lineHeight: "1.4",
                                maxHeight: "60px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {item.data?.message}
                            </p>
                          </div>
                        )}

                        {item.type === "image" && (
                          <div>
                            <p
                              style={{
                                margin: "0.5rem 0",
                                color: "#555",
                                fontSize: "0.875rem",
                              }}
                            >
                              <strong>From:</strong> {item.createdBy}
                            </p>
                            <p
                              style={{
                                margin: "0.5rem 0",
                                color: "#666",
                                fontSize: "0.875rem",
                                fontStyle: "italic",
                              }}
                            >
                              {item.data?.caption}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => deleteItem(item._id, "approved")}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#dc3545",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          height: "fit-content",
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY LOG TAB */}
          {activeTab === "activity" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>
                  Activity Log
                </h2>
                <button
                  onClick={() => {
                    setActivityLog([]);
                    localStorage.removeItem(ACTIVITY_LOG_KEY);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Clear Log
                </button>
              </div>

              {activityLog.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#999" }}>
                  <p style={{ fontSize: "1.125rem" }}>No activity yet</p>
                  <p style={{ fontSize: "0.875rem" }}>
                    Actions you take will appear here
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "1rem",
                        background: "#f8f9fa",
                        borderRadius: "6px",
                        border: "1px solid #e0e0e0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: "600",
                            color: log.action === "Approved" ? "#28a745" : "#dc3545",
                            marginRight: "0.5rem",
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ color: "#555" }}>
                          {log.itemType} - {log.itemTitle}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "#999" }}>
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
