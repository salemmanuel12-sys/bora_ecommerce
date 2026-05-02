import axios from "axios";
import { authService } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

function readStoredAuth() {
  try {
    const auth = localStorage.getItem("auth");
    return auth ? JSON.parse(auth) : null;
  } catch (_error) {
    localStorage.removeItem("auth");
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem("auth");
  localStorage.removeItem("user");
}

function readStoredUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (_error) {
    localStorage.removeItem("user");
    return null;
  }
}

api.interceptors.request.use((config) => {
  const parsed = readStoredAuth();
  if (!parsed?.accessToken) {
    return config;
  }

  config.headers = config.headers || {};
  config.headers.Authorization = `${parsed.tokenType || "Bearer"} ${parsed.accessToken}`;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isRefreshCall = originalRequest.url?.includes("/admin/auth/refresh");
    const parsed = readStoredAuth();

    if (!parsed?.accessToken) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      try {
        if (!parsed?.refreshToken) {
          throw new Error("No refresh token");
        }

        refreshPromise ||= authService
          .refreshSession(parsed.refreshToken)
          .then((refreshed) => {
            const nextAuth = {
              ...parsed,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              tokenType: refreshed.tokenType || "Bearer",
              expiresIn: refreshed.expiresIn,
            };

            localStorage.setItem("auth", JSON.stringify(nextAuth));
            return nextAuth;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const nextAuth = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `${nextAuth.tokenType || "Bearer"} ${nextAuth.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        const storedUser = readStoredUser();
        const isShopUser = storedUser?.sessionType === "usuario";
        clearStoredSession();
        window.location.href = isShopUser ? "/user" : "/administradores_bora";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
