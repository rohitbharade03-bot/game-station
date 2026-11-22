import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const USER_KEY = "gamestation_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load existing session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load Game Station user:", error);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = (email, password) => {
    if (!email || !password) {
      return {
        success: false,
        message: "Please enter email and password.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const newUser = {
      id: `player_${Date.now()}`,
      name: normalizedEmail.split("@")[0] || "Player",
      email: normalizedEmail,
      avatar: normalizedEmail.charAt(0).toUpperCase() || "P",
      level: 1,
      xp: 0,
      referralCode: `GS${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);

    return {
      success: true,
      user: newUser,
    };
  };

  // Sign up
  const signup = (name, email, password) => {
    if (!name || !email || !password) {
      return {
        success: false,
        message: "Please fill all fields.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters.",
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const newUser = {
      id: `player_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      avatar: name.trim().charAt(0).toUpperCase() || "P",
      level: 1,
      xp: 0,
      referralCode: `GS${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);

    return {
      success: true,
      user: newUser,
    };
  };

  // Logout
  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // Update profile
  const updateUser = (updates) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...updates,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;