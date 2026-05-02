import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4001/api";

const userAuthApi = axios.create({
  baseURL: API_BASE_URL,
});

export const userAuthService = {
  async register({ nombre, email, password }) {
    const response = await userAuthApi.post("/usuarios/auth/register", {
      nombre,
      email,
      password,
    });
    return response.data?.data ?? response.data;
  },

  async verifyEmail({ email, code }) {
    const response = await userAuthApi.post("/usuarios/auth/verify-email", {
      email,
      code,
    });
    return response.data?.data ?? response.data;
  },

  async login(email, password) {
    const response = await userAuthApi.post("/usuarios/auth/login", { email, password });
    return response.data?.data ?? response.data;
  },

  async socialLogin({ email, nombre, provider, providerUid }) {
    const response = await userAuthApi.post("/usuarios/auth/social", {
      email,
      nombre,
      provider,
      providerUid,
    });
    return response.data?.data ?? response.data;
  },
};
