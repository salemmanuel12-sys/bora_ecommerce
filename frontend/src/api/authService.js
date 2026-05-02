import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";

const authApi = axios.create({
  baseURL: API_BASE_URL,
});

export const authService = {
  async loginAdmin(email, password) {
    const response = await authApi.post("/admin/auth/login", { email, password });
    return response.data?.data ?? response.data;
  },

  async refreshSession(refreshToken) {
    const response = await authApi.post("/admin/auth/refresh", { refreshToken });
    return response.data?.data ?? response.data;
  },

  async logout(refreshToken) {
    const response = await authApi.post("/admin/auth/logout", { refreshToken });
    return response.data?.data ?? response.data;
  },
};
