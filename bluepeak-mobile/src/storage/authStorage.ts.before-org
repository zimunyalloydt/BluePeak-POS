
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const TOKEN_KEY = "bluepeak_token";
const USER_KEY = "bluepeak_user";
const OFFLINE_AUTH_KEY = "bluepeak_offline_auth";

type StoredOfflineAuth = {
    username: string;
    user: {
        userId: number;
        fullName: string;
        username: string;
        role: string;
        permissions: string[];
    };
    salt: string;
    passwordHash: string;
};

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((byte) =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
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

/**
 * Save the normal active authentication session.
 */
export async function saveAuth(
    token: string,
    user: object
) {
    await SecureStore.setItemAsync(
        TOKEN_KEY,
        token
    );

    await SecureStore.setItemAsync(
        USER_KEY,
        JSON.stringify(user)
    );
}

/**
 * Save credentials required for offline login.
 *
 * IMPORTANT:
 * The actual password is NEVER stored.
 */
export async function saveOfflineAuth(
    username: string,
    password: string,
    user: StoredOfflineAuth["user"]
): Promise<void> {
    const randomBytes =
        await Crypto.getRandomBytesAsync(16);

    const salt = bytesToHex(randomBytes);

    const passwordHash = await hashPassword(
        password,
        salt
    );

    const offlineAuth: StoredOfflineAuth = {
        username,
        user,
        salt,
        passwordHash,
    };

    await SecureStore.setItemAsync(
        OFFLINE_AUTH_KEY,
        JSON.stringify(offlineAuth)
    );
}

/**
 * Verify a username/password locally.
 *
 * Returns the cached user when valid.
 * Returns null when invalid or unavailable.
 */
export async function verifyOfflineLogin(
    username: string,
    password: string
): Promise<StoredOfflineAuth["user"] | null> {
    const stored =
        await SecureStore.getItemAsync(
            OFFLINE_AUTH_KEY
        );

    if (!stored) {
        return null;
    }

    try {
        const offlineAuth =
            JSON.parse(stored) as StoredOfflineAuth;

        if (
            offlineAuth.username.toLowerCase() !==
            username.trim().toLowerCase()
        ) {
            return null;
        }

        const passwordHash =
            await hashPassword(
                password,
                offlineAuth.salt
            );

        if (
            passwordHash !==
            offlineAuth.passwordHash
        ) {
            return null;
        }

        return offlineAuth.user;
    } catch (error) {
        console.error(
            "Failed to verify offline login:",
            error
        );

        return null;
    }
}

export async function getToken() {
    return await SecureStore.getItemAsync(
        TOKEN_KEY
    );
}

export async function getUser() {
    const user =
        await SecureStore.getItemAsync(
            USER_KEY
        );

    return user ? JSON.parse(user) : null;
}

/**
 * Clears the CURRENT SESSION.
 *
 * We intentionally keep the offline credential
 * so the user can log in again without internet.
 */
export async function clearAuth() {
    await SecureStore.deleteItemAsync(
        TOKEN_KEY
    );

    await SecureStore.deleteItemAsync(
        USER_KEY
    );
}

/**
 * Completely removes offline login capability
 * from this device.
 */
export async function clearOfflineAuth() {
    await SecureStore.deleteItemAsync(
        OFFLINE_AUTH_KEY
    );
}
