import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_AUTH_STORAGE_KEY = "birthday_admin_auth";
const ACTIVITY_LOG_KEY = "admin_activity_log";
const RELATIONSHIP_OPTIONS = [
  "Friend",
  "Sister",
  "Brother",
  "Close Friend",
  "Cousin",
  "Coursemate",
  "Family",
  "Other",
];

function detectMediaTypeFromData(dataUrl) {
  if (!dataUrl) return "image";
  return dataUrl.startsWith("data:video/") ? "video" : "image";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const savedAuth = useMemo(() => {
    try {
      const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const [token, setToken] = useState(savedAuth?.token || "");
  const [username, setUsername] = useState(savedAuth?.username || "");
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
  const [adminMessageForm, setAdminMessageForm] = useState({
    name: "",
    role: "Friend",
    otherRole: "",
    message: "",
    caption: "",
    avatarFileData: null,
    avatarFileName: "",
    mediaFiles: [], // { fileData, fileName, mediaType }
  });
  const [adminMessageErrors, setAdminMessageErrors] = useState({});
  const [adminMessageLoading, setAdminMessageLoading] = useState(false);
  const [currentAdminMessage, setCurrentAdminMessage] = useState(null);

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
        if (data.adminMessage) {
          setCurrentAdminMessage(data.adminMessage);
          setAdminMessageForm((prev) => ({
            ...prev,
            message: data.adminMessage.text || "",
            mediaFiles: data.adminMessage.imageUrl
              ? [{
                  fileData: data.adminMessage.imageUrl,
                  fileName: "current-admin-message",
                  mediaType: data.adminMessage.imageMediaType || "image",
                }]
              : [],
          }));
        }
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
      const totalContent = allPosts.length;

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
          // Update stats when deleting approved posts
          setStats((prev) => ({
            ...prev,
            totalContent: prev.totalContent - 1,
          }));
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

  const handleAdminAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAdminMessageForm((p) => ({
        ...p,
        avatarFileData: reader.result,
        avatarFileName: file.name,
      }));
      setAdminMessageErrors((prev) => ({ ...prev, avatar: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdminMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const toAdd = [];
    let done = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        toAdd.push({
          fileData: reader.result,
          fileName: file.name,
          mediaType: detectMediaTypeFromData(reader.result),
        });
        done += 1;
        if (done === files.length) {
          setAdminMessageForm((p) => ({ ...p, mediaFiles: [...p.mediaFiles, ...toAdd] }));
          setAdminMessageErrors((prev) => ({ ...prev, memories: false }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdminMedia = (idx) => {
    setAdminMessageForm((p) => ({
      ...p,
      mediaFiles: p.mediaFiles.filter((_, i) => i !== idx),
    }));
  };

  const validateAdminMessageForm = () => {
    const e = {};
    if (!adminMessageForm.name.trim()) e.name = true;
    if (!adminMessageForm.role) e.role = true;
    if (adminMessageForm.role === "Other" && !adminMessageForm.otherRole.trim()) e.otherRole = true;
    if (!adminMessageForm.avatarFileData) e.avatar = true;
    if (!adminMessageForm.message.trim()) e.message = true;
    if (adminMessageForm.mediaFiles.length === 0) e.memories = true;
    if (adminMessageForm.mediaFiles.length > 0 && !adminMessageForm.caption.trim()) e.caption = true;
    return e;
  };

  const uploadFile = async (fileData, fileName) => {
    const res = await fetch(`${API_BASE}/api/media/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: fileData, filename: fileName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload failed");
    return json.url;
  };

  const saveAdminMessage = async () => {
    const validation = validateAdminMessageForm();
    setAdminMessageErrors(validation);
    if (Object.keys(validation).length > 0) {
      setStatus("Please complete all required guest-style fields.");
      return;
    }

    const activeToken = token || savedAuth?.token;
    if (!activeToken) {
      setStatus("Your admin session expired. Please log in again.");
      navigate("/admin/login", { replace: true });
      return;
    }

    setAdminMessageLoading(true);
    try {
      const resolvedRole =
        adminMessageForm.role === "Other"
          ? adminMessageForm.otherRole.trim()
          : adminMessageForm.role;

      // Upload avatar
      setStatus("Uploading profile image...");
      let avatarUrl = "";
      if (adminMessageForm.avatarFileData) {
        avatarUrl = await uploadFile(
          adminMessageForm.avatarFileData,
          adminMessageForm.avatarFileName || `admin-avatar-${Date.now()}`
        );
      }

      // Save pinned message with avatar image
      const messageText = `${adminMessageForm.message.trim()}\n\n- ${adminMessageForm.name.trim()} (${resolvedRole})`;
      setStatus("Pinning your message...");
      const msgRes = await fetch(`${API_BASE}/api/admin/admin-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: messageText,
          imageUrl: avatarUrl,
          imageMediaType: "image",
        }),
      });

      const msgData = await msgRes.json();
      if (!msgRes.ok) throw new Error(msgData.message || "Failed to pin message");

      // Upload media files to gallery (like guest does)
      for (let i = 0; i < adminMessageForm.mediaFiles.length; i++) {
        const mf = adminMessageForm.mediaFiles[i];
        setStatus(`Uploading memory ${i + 1} of ${adminMessageForm.mediaFiles.length} to gallery...`);
        const mediaUrl = await uploadFile(
          mf.fileData,
          mf.fileName || `admin-media-${Date.now()}`
        );

        setStatus("Saving memory to gallery...");
        const galleryRes = await fetch(`${API_BASE}/api/content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "image",
            title: `Memory from ${adminMessageForm.name}`,
            data: {
              url: mediaUrl,
              caption: adminMessageForm.caption,
              mediaType: mf.mediaType || detectMediaTypeFromData(mf.fileData),
            },
            createdBy: adminMessageForm.name,
          }),
        });
        const galleryData = await galleryRes.json();
        if (!galleryRes.ok)
          throw new Error(galleryData.message || "Failed to save memory");
      }

      setStatus("✅ Message pinned and memories saved!");
      setCurrentAdminMessage(msgData.adminMessage);
      addToActivityLog(
        "Pinned Message",
        messageText.substring(0, 50),
        "admin-message"
      );
      await loadAllData(activeToken);

      // Clear form
      setTimeout(() => {
        setAdminMessageForm({
          name: "",
          role: "Friend",
          otherRole: "",
          message: "",
          caption: "",
          avatarFileData: null,
          avatarFileName: "",
          mediaFiles: [],
        });
        setAdminMessageErrors({});
        setStatus("");
      }, 2000);
    } catch (err) {
      console.error("Error saving admin message:", err);
      setStatus(`Error: ${err.message || "Failed to save"}`);
    }
    setAdminMessageLoading(false);
  };

  const deleteAdminMessage = async () => {
    if (!window.confirm("Remove your pinned message?")) return;

    setAdminMessageLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/admin-message`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (res.ok) {
        setStatus("✅ Message unpinned");
        setCurrentAdminMessage(null);
        setAdminMessageForm({
          name: "",
          role: "Friend",
          otherRole: "",
          message: "",
          caption: "",
          avatarFileData: null,
          avatarFileName: "",
          mediaFiles: [],
        });
        setAdminMessageErrors({});
        addToActivityLog("Unpinned Message", "Admin message removed", "admin-message");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting admin message:", err);
      setStatus("Error deleting message");
    }
    setAdminMessageLoading(false);
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
            {/* UNUSED: Website Content tab - commented out
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
            </button> */}
            {/* UNUSED: Moderation tab - commented out for later use
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
            </button> */}
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
              onClick={() => setActiveTab("my-message")}
              style={{
                padding: "1rem 1.5rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === "my-message"
                    ? "3px solid #d4af37"
                    : "3px solid transparent",
                color: activeTab === "my-message" ? "#d4af37" : "#666",
                fontWeight: activeTab === "my-message" ? "600" : "400",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
            >
              📌 My Message
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

          {/* UNUSED: Website Content tab - disabled (showed Playlist, Gallery, Notes counts) */}

          {/* 
          UNUSED: MODERATION TAB - commented out for later use
          When needed, uncomment the following code and remove the comment markers.
          This tab allows admin to review pending submissions with filtering and search.
          */}

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

          {/* MY MESSAGE TAB */}
          {activeTab === "my-message" && (
            <div>
              <h2 style={{ marginTop: 0, color: "#333", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
                📌 Your Pinned Message
              </h2>
              <p style={{ color: "#666", marginBottom: "2rem", fontSize: "0.95rem" }}>
                Share a personal message with a photo that will be pinned at the top of all messages
              </p>

              {status && (
                <p
                  style={{
                    padding: "0.75rem 1rem",
                    background: status.includes("✅") ? "#d4edda" : "#f8d7da",
                    color: status.includes("✅") ? "#155724" : "#721c24",
                    borderRadius: "4px",
                    marginBottom: "1.5rem",
                    border: `1px solid ${status.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`,
                  }}
                >
                  {status}
                </p>
              )}

              <div style={{ display: "grid", gap: "2rem" }}>
                {/* Form */}
                <div
                  style={{
                    padding: "2rem",
                    background: "#f9f9f9",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#333" }}>Guest Flow Form (Admin Pin)</h3>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="admin-name">Your Name</label>
                    <input
                      id="admin-name"
                      type="text"
                      value={adminMessageForm.name}
                      onChange={(e) => setAdminMessageForm((p) => ({ ...p, name: e.target.value }))}
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.name ? "input-error" : ""}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="admin-role">Relationship</label>
                    <select
                      id="admin-role"
                      value={adminMessageForm.role}
                      onChange={(e) => setAdminMessageForm((p) => ({ ...p, role: e.target.value }))}
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.role ? "input-error" : ""}
                    >
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {adminMessageForm.role === "Other" && (
                    <div className="form-group" style={{ marginBottom: "1rem" }}>
                      <label htmlFor="admin-other-role">Type your relationship</label>
                      <input
                        id="admin-other-role"
                        type="text"
                        value={adminMessageForm.otherRole}
                        onChange={(e) =>
                          setAdminMessageForm((p) => ({ ...p, otherRole: e.target.value }))
                        }
                        disabled={adminMessageLoading}
                        className={adminMessageErrors.otherRole ? "input-error" : ""}
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="admin-avatar">Profile Image</label>
                    <input
                      id="admin-avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAdminAvatarChange}
                      onClick={(e) => {
                        e.target.value = "";
                      }}
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.avatar ? "input-error" : ""}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="admin-message">Your Message</label>
                    <textarea
                      id="admin-message"
                      rows={4}
                      value={adminMessageForm.message}
                      onChange={(e) =>
                        setAdminMessageForm((p) => ({ ...p, message: e.target.value }))
                      }
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.message ? "input-error" : ""}
                      placeholder="Write your heartfelt wish here..."
                      style={{ width: "100%", minHeight: "120px" }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label htmlFor="admin-memories">Memories Upload</label>
                    <input
                      id="admin-memories"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleAdminMediaChange}
                      onClick={(e) => {
                        e.target.value = "";
                      }}
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.memories ? "input-error" : ""}
                    />
                  </div>

                  {adminMessageForm.mediaFiles.length > 0 && (
                    <div style={{ marginBottom: "1rem", border: "1px solid #ddd", borderRadius: "6px", padding: "0.75rem" }}>
                      {adminMessageForm.mediaFiles.map((f, idx) => (
                        <div
                          key={`${f.fileName}-${idx}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: idx < adminMessageForm.mediaFiles.length - 1 ? "0.5rem" : 0,
                          }}
                        >
                          <span style={{ fontSize: "0.875rem", color: "#555" }}>
                            {f.fileName || `memory-${idx + 1}`} ({f.mediaType})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAdminMedia(idx)}
                            disabled={adminMessageLoading}
                            style={{
                              padding: "0.3rem 0.6rem",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="admin-caption">Caption (required for memories)</label>
                    <input
                      id="admin-caption"
                      type="text"
                      value={adminMessageForm.caption}
                      onChange={(e) =>
                        setAdminMessageForm((p) => ({ ...p, caption: e.target.value }))
                      }
                      disabled={adminMessageLoading}
                      className={adminMessageErrors.caption ? "input-error" : ""}
                    />
                  </div>

                  <button
                    onClick={saveAdminMessage}
                    disabled={adminMessageLoading}
                    style={{
                      padding: "0.75rem 2rem",
                      background: "#d4af37",
                      color: "#333",
                      border: "none",
                      borderRadius: "6px",
                      cursor: adminMessageLoading ? "not-allowed" : "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      opacity: adminMessageLoading ? 0.6 : 1,
                    }}
                  >
                    {adminMessageLoading ? "Pinning..." : "📌 Pin My Message"}
                  </button>
                </div>

                {/* Current Message Display - Matches Guest View */}
                {currentAdminMessage && (
                  <div
                    style={{
                      padding: "2rem",
                      background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                      borderRadius: "12px",
                      border: "3px solid #d4af37",
                      boxShadow: "0 12px 32px rgba(212, 175, 55, 0.4), 0 0 24px rgba(212, 175, 55, 0.2)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Shine effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 
                          "radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)",
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                          {currentAdminMessage.imageUrl && currentAdminMessage.imageMediaType !== "video" ? (
                            <img
                              src={currentAdminMessage.imageUrl}
                              alt="admin avatar"
                              loading="eager"
                              style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "50%",
                                border: "2px solid #d4af37",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : null}
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                background: "rgba(255, 255, 255, 0.95)",
                                color: "#333",
                                padding: "0.25rem 0.6rem",
                                borderRadius: "8px",
                                fontSize: "0.7rem",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                border: "2px solid #d4af37",
                                marginBottom: "0.5rem",
                              }}
                            >
                              ✨ From Host ✨
                            </span>
                            <h3 style={{ margin: "0.5rem 0 0 0", color: "#333", fontSize: "1rem" }}>
                              📌 Special Message
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={deleteAdminMessage}
                          disabled={adminMessageLoading}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: adminMessageLoading ? "not-allowed" : "pointer",
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          🗑️ Unpin
                        </button>
                      </div>

                      <p
                        style={{
                          margin: "1rem 0",
                          fontSize: "1rem",
                          color: "#2b1f0f",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          textShadow: "0 1px 0 rgba(255,255,255,0.45)",
                        }}
                      >
                        {currentAdminMessage.text}
                      </p>

                      <p
                        style={{
                          marginTop: "1.5rem",
                          fontSize: "0.875rem",
                          color: "rgba(51, 51, 51, 0.7)",
                          fontStyle: "italic",
                        }}
                      >
                        Updated: {new Date(currentAdminMessage.updatedAt).toLocaleDateString()} at {new Date(currentAdminMessage.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
