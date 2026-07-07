import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const { email } = JSON.parse(authData);
        setUser({ email });
      } catch (e) {
        localStorage.removeItem("authData");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { token } = response.data;
      
      const authData = { email, password, token };
      localStorage.setItem("authData", JSON.stringify(authData));
      setUser({ email });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Invalid email or password";
      return { success: false, error: message };
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const response = await api.post("/api/auth/register", {
        fullName,
        email,
        password,
      });
      const { token } = response.data;
      
      const authData = { email, password, token };
      localStorage.setItem("authData", JSON.stringify(authData));
      setUser({ email });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Email might already exist.";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem("authData");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
