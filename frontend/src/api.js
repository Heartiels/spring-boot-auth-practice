const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error ?? "The request could not be completed.", response.status);
  }
  return data;
}

function submitCredentials(path, username, password) {
  return request(path, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function register(username, password) {
  return submitCredentials("/api/auth/register", username, password);
}

export function login(username, password) {
  return submitCredentials("/api/auth/login", username, password);
}

export function getProfile(token) {
  return request("/api/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
