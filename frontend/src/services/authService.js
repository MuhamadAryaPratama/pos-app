import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with ngrok configuration
const createApiInstance = (withAuth = false) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    timeout: 30000,
  });

  if (withAuth) {
    // Add token to requests
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token expiry
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("authChange"));

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  return instance;
};

const authApi = createApiInstance(false);
const api = createApiInstance(true);

export const authService = {
  login: async (email, password) => {
    try {
      const response = await authApi.post("/auth/login", { email, password });

      if (response.data.success) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));

        // Store login time to track 8-hour expiry
        localStorage.setItem("loginTime", Date.now().toString());

        window.dispatchEvent(new Event("authChange"));
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await authApi.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call backend logout endpoint
      await api.post("/auth/logout");
      console.log("Logout successful on backend");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local storage and trigger auth change
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      window.dispatchEvent(new Event("authChange"));
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await authApi.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await authApi.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");

      // Update local storage with fresh user data
      if (response.data.success && response.data.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await authApi.get(`/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      console.error("Email verification error:", error);
      throw error;
    }
  },

  updateProfile: async (updateData) => {
    try {
      const response = await api.put("/auth/profile", updateData);

      // Update local storage with fresh user data
      if (response.data.success && response.data.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        window.dispatchEvent(new Event("authChange"));
      }

      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Check if token is expired (8 hours)
  isTokenExpired: () => {
    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) return true;

    const now = Date.now();
    const elapsed = now - parseInt(loginTime);
    const eightHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

    return elapsed >= eightHours;
  },

  // Helper function to check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) return false;

    // Check if token is expired
    if (authService.isTokenExpired()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      window.dispatchEvent(new Event("authChange"));
      return false;
    }

    return true;
  },

  // Helper function to get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  },

  // Get remaining session time
  getRemainingTime: () => {
    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) return 0;

    const now = Date.now();
    const elapsed = now - parseInt(loginTime);
    const eightHours = 8 * 60 * 60 * 1000;
    const remaining = eightHours - elapsed;

    return remaining > 0 ? remaining : 0;
  },
};

// Export for use in other services
export { api, authApi };
