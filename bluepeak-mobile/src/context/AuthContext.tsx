import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    clearAuth,
    getToken,
    getUser,
    saveAuth,
} from "../storage/authStorage";

import { login as apiLogin } from "../services/authService";

export type User = {
    userId: number;
    fullName: string;
    username: string;
    role: string;
    permissions: string[];
};

type AuthContextType = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (
        username: string,
        password: string
    ) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<
    AuthContextType | undefined
>(undefined);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(
        null
    );

    const [token, setToken] = useState<string | null>(
        null
    );

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken = await getToken();
            const storedUser = await getUser();

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(storedUser);
            }
        } catch (error) {
            console.error(
                "Failed to restore session:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const login = async (
        username: string,
        password: string
    ): Promise<User> => {
        const result = await apiLogin(
            username,
            password
        );

        const userData: User = {
            userId: result.userId,
            fullName: result.fullName,
            username: result.username,
            role: result.role,
            permissions: result.permissions,
        };

        await saveAuth(
            result.token,
            userData
        );

        setToken(result.token);
        setUser(userData);

        return userData;
    };

    const logout = async () => {
        await clearAuth();

        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}