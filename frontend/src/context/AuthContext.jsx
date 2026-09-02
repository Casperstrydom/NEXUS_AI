import { createContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
    Check whether the user already has
    an active Express session.
  */
  async function fetchCurrentUser() {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setUser(null);
        return null;
      }

      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error("Unable to retrieve current user:", error);

      setUser(null);

      return null;
    }
  }

  /*
    Check the session when the application starts.
  */
  useEffect(() => {
    async function loadUser() {
      await fetchCurrentUser();
      setLoading(false);
    }

    loadUser();
  }, []);

  /*
    Logout the current user.
  */
  async function logout() {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to logout.");
      }

      setUser(null);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Logout error:", error);

      return {
        success: false,
        message: error.message || "Unable to logout.",
      };
    }
  }

  const value = {
    user,
    setUser,
    loading,
    logout,
    fetchCurrentUser,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
