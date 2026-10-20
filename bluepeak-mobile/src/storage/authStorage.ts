import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const TOKEN_KEY = "bluepeak_token";
const USER_KEY = "bluepeak_user";
const OFFLINE_AUTH_KEY = "bluepeak_offline_auth";
const OFFLINE_AUTH_V2_KEY = "bluepeak_offline_auth_v2";

export type StoredAuthUser = {
userId: number;
fullName: string;
username: string;
role: string;
permissions: string[];

organisationId: number;
organisationName: string;
organisationCode: string;
// Optional organisation details used on printed receipts.
organisationAddress?: string | null;
organisationPhoneNumber?: string | null;
organisationEmail?: string | null;
organisationLogoUrl?: string | null;

};

type StoredOfflineAuth = {
    username: string;
    organisationId: number;
    organisationName: string;
    organisationCode: string;
    user: StoredAuthUser;
    salt: string;
    passwordHash: string;
};

type LegacyOfflineAuth = {
    username: string;
    user: {
        userId: number;
        fullName: string;
        username: string;
        role: string;
        permissions: string[];
        organisationId?: number;
        organisationName?: string;
        organisationCode?: string;
    };
    salt: string;
    passwordHash: string;
};

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function getOfflineAccountKey(
    organisationCode: string,
    username: string
): string {
    return `${organisationCode.trim().toUpperCase()}:${username.trim().toLowerCase()}`;
}

async function hashPassword(
    password: string,
    salt: string
): Promise<string> {
    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${salt}:${password}`
    );
}

export async function saveAuth(
    token: string,
    user: StoredAuthUser
): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function saveOfflineAuth(
    username: string,
    password: string,
    user: StoredAuthUser
): Promise<void> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const salt = bytesToHex(randomBytes);

    const passwordHash = await hashPassword(password, salt);

    const offlineAuth: StoredOfflineAuth = {
        username: username.trim(),
        organisationId: user.organisationId,
        organisationName: user.organisationName,
        organisationCode: user.organisationCode.trim().toUpperCase(),
        user,
        salt,
        passwordHash,
    };

    const stored = await SecureStore.getItemAsync(OFFLINE_AUTH_V2_KEY);

    let accounts: Record<string, StoredOfflineAuth> = {};

    if (stored) {
        try {
            accounts = JSON.parse(stored) as Record<string, StoredOfflineAuth>;
        } catch {
            accounts = {};
        }
    }

    const key = getOfflineAccountKey(
        offlineAuth.organisationCode,
        offlineAuth.username
    );

    accounts[key] = offlineAuth;

    await SecureStore.setItemAsync(
        OFFLINE_AUTH_V2_KEY,
        JSON.stringify(accounts)
    );
}

/**
 * Verify offline credentials for a specific organisation.
 *
 * Credentials cached for one organisation cannot authenticate
 * a user into another organisation.
 */
export async function verifyOfflineLogin(
    organisationCode: string,
    username: string,
    password: string
): Promise<StoredAuthUser | null> {
    const normalisedCode = organisationCode.trim().toUpperCase();
    const normalisedUsername = username.trim();

    try {
        const storedV2 = await SecureStore.getItemAsync(OFFLINE_AUTH_V2_KEY);

        if (storedV2) {
            const accounts = JSON.parse(storedV2) as Record<string, StoredOfflineAuth>;

            const key = getOfflineAccountKey(
                normalisedCode,
                normalisedUsername
            );

            const offlineAuth = accounts[key];

            if (offlineAuth) {
                const passwordHash = await hashPassword(
                    password,
                    offlineAuth.salt
                );

                if (passwordHash !== offlineAuth.passwordHash) {
                    return null;
                }

                return offlineAuth.user;
            }
        }

        /*
         * Backward compatibility for the previous single-account
         * offline cache. It can only be used for COLDSTONE.
         */
        if (normalisedCode !== "COLDSTONE") {
            return null;
        }

        const legacyStored = await SecureStore.getItemAsync(OFFLINE_AUTH_KEY);

        if (!legacyStored) {
            return null;
        }

        const legacy = JSON.parse(legacyStored) as LegacyOfflineAuth;

        if (
            legacy.username.trim().toLowerCase() !==
            normalisedUsername.toLowerCase()
        ) {
            return null;
        }

        const legacyHash = await hashPassword(password, legacy.salt);

        if (legacyHash !== legacy.passwordHash) {
            return null;
        }

        const legacyUser: StoredAuthUser = {
            userId: legacy.user.userId,
            fullName: legacy.user.fullName,
            username: legacy.user.username,
            role: legacy.user.role,
            permissions: legacy.user.permissions ?? [],
            organisationId: legacy.user.organisationId ?? 1,
            organisationName: legacy.user.organisationName ?? "Coldstone",
            organisationCode: "COLDSTONE",
        };

        // Migrate the verified legacy credentials to the new format.
        await saveOfflineAuth(
            normalisedUsername,
            password,
            legacyUser
        );

        return legacyUser;
    } catch (error) {
        console.error("Failed to verify offline login:", error);
        return null;
    }
}

export async function getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<StoredAuthUser | null> {
    const stored = await SecureStore.getItemAsync(USER_KEY);

    if (!stored) {
        return null;
    }

    try {
        return JSON.parse(stored) as StoredAuthUser;
    } catch {
        return null;
    }
}

/**
 * Clear the active session but retain offline credentials.
 */
export async function clearAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
}

/**
 * Remove all cached offline credentials, including the legacy cache.
 */
export async function clearOfflineAuth(): Promise<void> {
    await SecureStore.deleteItemAsync(OFFLINE_AUTH_KEY);
    await SecureStore.deleteItemAsync(OFFLINE_AUTH_V2_KEY);
}
