import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Very important: send cookies to API
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.log("Not authenticated with NextAuth");
    }
    return Promise.reject(err);
  }
);

export default api;
