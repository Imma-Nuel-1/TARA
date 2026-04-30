const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      payload.message || `Request failed with ${response.status}`,
    );
  }
  return response.json();
}

export { API_BASE };
