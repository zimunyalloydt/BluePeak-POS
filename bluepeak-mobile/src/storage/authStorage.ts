import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bluepeak_token";
const USER_KEY = "bluepeak_user";

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

export async function getToken() {
    return await SecureStore.getItemAsync(
        TOKEN_KEY
    );
}

export async function getUser() {
    const user = await SecureStore.getItemAsync(
        USER_KEY
    );

    return user ? JSON.parse(user) : null;
}

export async function clearAuth() {
    await SecureStore.deleteItemAsync(
        TOKEN_KEY
    );

    await SecureStore.deleteItemAsync(
        USER_KEY
    );
}
