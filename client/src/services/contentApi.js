const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getPublicContent() {
  const res = await fetch(`${API_BASE}/api/public/site-content`);
  if (!res.ok) throw new Error("Failed to load content");
  return await res.json();
}
