// Axios client for the CORA backend.
import axios from "axios";
import Config from "react-native-config";

const normalizeBackendUrl = url => {
  const baseUrl = (url || "").replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

export const getBackendUrl = () => {
  const envUrl = process.env.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || Config.BACKEND_URL;
  if (envUrl) return envUrl;
  return "https://corakey-backend.onrender.com";
};

const api = axios.create({
  baseURL: normalizeBackendUrl(getBackendUrl()),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setBackendUrl = backendUrl => {
  if (backendUrl) {
    api.defaults.baseURL = normalizeBackendUrl(backendUrl);
  }
};

api.interceptors.request.use(config => {
  console.log("[API]", config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  response => {
    console.log("[API] response", response.status, response.config.url);
    return response;
  },
  error => {
    console.error(
      "[API] error",
      error.response?.status,
      error.config?.url,
      error.response?.data?.message || error.message
    );
    return Promise.reject(error);
  }
);

export default api;
