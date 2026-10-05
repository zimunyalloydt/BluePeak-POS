
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
    saveOfflineAuth,
    verifyOfflineLogin,
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
    const [user, setUser] =
        useState<User | null>(null);

    const [token, setToken] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken =
                await getToken();

            const storedUser =
                await getUser();

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
        try {
            console.log(
                "🔐 Attempting online login..."
            );

            const result = await apiLogin(
                username,
                password
            );

            const userData: User = {
                userId: result.userId,
                fullName: result.fullName,
                username: result.username,
                role: result.role,
                permissions:
                    result.permissions,
            };

            // Save normal active session.
            await saveAuth(
                result.token,
                userData
            );

            // Save offline authentication.
            await saveOfflineAuth(
                username,
                password,
                userData
            );

            setToken(result.token);
            setUser(userData);

            console.log(
                "✅ Online login successful"
            );

            return userData;
        } catch (error: any) {
            /*
             * IMPORTANT:
             *
             * If the API actually responded with
             * 401/403/etc, do NOT try offline login.
             *
             * Offline login is only attempted when
             * there is no HTTP response, which normally
             * means network/server connectivity failure.
             */
            if (error?.response) {
                console.log(
                    "❌ Server rejected login:",
                    error.response.status
                );

                throw error;
            }

            console.log(
                "📴 Network unavailable. Trying offline login..."
            );

            const offlineUser =
                await verifyOfflineLogin(
                    username,
                    password
                );

            if (!offlineUser) {
                console.log(
                    "❌ Offline login failed"
                );

                throw new Error(
                    "No internet connection and the username or password is not available for offline login."
                );
            }

            /*
             * We don't have a fresh server token
             * while offline.
             *
             * The cached token is restored so the
             * application can maintain its existing
             * authenticated state. Offline operations
             * should remain local until synchronization
             * is available.
             */
            const storedToken =
                await getToken();

            setToken(storedToken);
            setUser(offlineUser);

            console.log(
                "✅ Offline login successful"
            );

            return offlineUser;
        }
    };

    const logout = async () => {
        /*
         * Only clear the active session.
         *
         * Keep offline credentials so this device
         * can still authenticate without internet.
         */
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
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}
