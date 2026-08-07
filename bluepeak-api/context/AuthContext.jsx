import { createContext, useEffect, useState } from "react";
import { getUser, clearAuth, saveAuth } from "../../bluepeak-admin/src/utils/storage";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = getUser();

        if (stored) {
            setUser(stored);
        }
    }, []);

    const login = (data) => {
        saveAuth(data);
        setUser(data);
    };

    const logout = () => {
        clearAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}