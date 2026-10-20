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
    type StoredAuthUser,
} from "../storage/authStorage";

import { login as apiLogin } from "../services/authService";

import {
    initializeLocalDatabase,
    setActiveOrganisation,
} from "../services/localDatabase";

export type User = StoredAuthUser;

type AuthContextType = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (
        organisationCode: string,
        username: string,
        password: string
    ) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken = await getToken();
            const storedUser = await getUser();

            if (
                storedToken &&
                storedUser &&
                storedUser.organisationId > 0 &&
                storedUser.organisationCode
            ) {
                await setActiveOrganisation(
                    storedUser.organisationId
                );

                await initializeLocalDatabase();

                setToken(storedToken);
                setUser(storedUser);
            } else {
                await clearAuth();
            }
        } catch (error) {
            console.error(
                "Failed to restore authenticated session:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const login = async (
        organisationCode: string,
        username: string,
        password: string
    ): Promise<User> => {
        const normalisedCode =
            organisationCode.trim().toUpperCase();

        const normalisedUsername = username.trim();

        if (
            !normalisedCode ||
            !normalisedUsername ||
            !password
        ) {
            throw new Error(
                "Organisation code, username and password are required."
            );
        }

        let authenticatedUser: User;
        let authenticatedToken: string | null = null;
        let online = false;

        try {
            const result = await apiLogin(
                normalisedUsername,
                password,
                normalisedCode
            );

            authenticatedUser = {
                userId: result.userId,
                fullName: result.fullName,
                username: result.username,
                role: result.role,
                permissions: result.permissions ?? [],
                organisationId: result.organisationId,
                organisationName: result.organisationName,
                organisationCode: result.organisationCode,
                organisationAddress: result.organisationAddress,
organisationPhoneNumber: result.organisationPhoneNumber,
organisationEmail: result.organisationEmail,
organisationLogoUrl: result.organisationLogoUrl,
            };

            authenticatedToken = result.token;
            online = true;
        } catch (error: any) {
            // Never use offline login to bypass a server rejection.
            if (error?.response) {
                throw error;
            }

            const offlineUser = await verifyOfflineLogin(
                normalisedCode,
                normalisedUsername,
                password
            );

            if (!offlineUser) {
                throw new Error(
                    "You are offline, and no matching offline account was found for this organisation."
                );
            }

            authenticatedUser = offlineUser;
        }

        if (
            !Number.isInteger(authenticatedUser.organisationId) ||
            authenticatedUser.organisationId < 1 ||
            authenticatedUser.organisationCode.trim().toUpperCase() !==
                normalisedCode
        ) {
            throw new Error(
                "The authenticated account's organisation details are invalid."
            );
        }

        /*
         * Select and initialize the organisation database before
         * allowing the application to navigate to its main screens.
         */
        try {
            await setActiveOrganisation(
                authenticatedUser.organisationId
            );

            await initializeLocalDatabase();
        } catch (error) {
            console.error(
                "Failed to initialize organisation database:",
                error
            );

            throw new Error(
                "Could not open this organisation's local database. Please try again."
            );
        }

        if (online && authenticatedToken) {
            await saveAuth(
                authenticatedToken,
                authenticatedUser
            );

            await saveOfflineAuth(
                normalisedUsername,
                password,
                authenticatedUser
            );

            setToken(authenticatedToken);
        } else {
            /*
             * Offline login has no valid server token.
             * Never retain a token from a previous session.
             */
            await clearAuth();
            setToken(null);
        }

        setUser(authenticatedUser);

        console.log(
            `${online ? "Online" : "Offline"} login successful for ${authenticatedUser.organisationName}`
        );

        return authenticatedUser;
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
