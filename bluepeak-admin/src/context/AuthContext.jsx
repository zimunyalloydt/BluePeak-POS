import { createContext, useContext, useEffect, useState } from "react";
import { clearAuth, getUser, saveAuth } from "../utils/storage";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();

    if (storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    saveAuth(userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setUser(null);

    // Redirect to login page
    window.location.href = "/login";
  };

  

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>

    
  );
}

export const useAuth = () => useContext(AuthContext);