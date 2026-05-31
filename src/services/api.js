// Axios client for the CORA backend.
import axios from "axios";
import Config from "react-native-config";

const api = axios.create({
  baseURL: Config.BACKEND_URL || "http://10.0.2.2:5000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setBackendUrl = backendUrl => {
  if (backendUrl) {
    api.defaults.baseURL = backendUrl;
  }
};

export default api;
