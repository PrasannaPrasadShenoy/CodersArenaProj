import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Allow injecting Clerk getToken so API requests send Bearer token (required for cross-origin auth)
let authTokenGetter = null;
export function setAuthTokenGetter(getter) {
  authTokenGetter = getter;
}

axiosInstance.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    try {
      const token = await authTokenGetter();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
  }
  return config;
});

export default axiosInstance;
