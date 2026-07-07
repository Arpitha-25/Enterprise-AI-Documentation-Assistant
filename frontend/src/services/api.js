import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercept requests to inject the Authorization: Basic ... header
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const { email, password } = JSON.parse(authData);
        if (email && password) {
          const credentials = btoa(`${email}:${password}`);
          config.headers.Authorization = `Basic ${credentials}`;
        }
      } catch (e) {
        console.error("Failed to parse auth data from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
