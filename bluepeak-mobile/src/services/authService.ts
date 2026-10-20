import api from "./api";

export interface LoginRequest {
    username: string;
    password: string;
    organisationCode: string;
}

export interface LoginResponse {
    userId: number;
    fullName: string;
    username: string;
    role: string;
    token: string;
    expiry: string;
    permissions: string[];

    // Organisation details returned by the backend.
    organisationId: number;
    organisationName: string;
    organisationCode: string;
        organisationAddress?: string | null;
    organisationPhoneNumber?: string | null;
    organisationEmail?: string | null;
    organisationLogoUrl?: string | null;
}

export async function login(
    username: string,
    password: string,
    organisationCode: string
): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
        "/Auth/login",
        {
            username,
            password,
            organisationCode: organisationCode
                .trim()
                .toUpperCase(),
        }
    );

    return response.data;
}
