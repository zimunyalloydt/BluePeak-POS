import api from "./api";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    userId: number;
    fullName: string;
    username: string;
    role: string;
    token: string;
    expiry: string;
    permissions: string[];
}

export async function login(
    username: string,
    password: string
): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/Auth/login", {
        username,
        password,
    });

    return response.data;
}
