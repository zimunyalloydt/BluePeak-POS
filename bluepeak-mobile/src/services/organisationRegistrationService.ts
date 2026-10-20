import api from "./api";

export interface RegisterOrganisationRequest {
    organisationName: string;
    organisationCode: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    adminEmail: string;
    adminPhone?: string;
}

export interface OrganisationRegistrationResult {
    success: boolean;
    message: string;
    organisationId?: number | null;
    organisationName?: string | null;
    organisationCode?: string | null;
    adminUsername?: string | null;
}

export async function registerOrganisation(
    request: RegisterOrganisationRequest
): Promise<OrganisationRegistrationResult> {
    const response =
        await api.post<OrganisationRegistrationResult>(
            "/Auth/register-organisation",
            {
                ...request,
                organisationName:
                    request.organisationName.trim(),
                organisationCode:
                    request.organisationCode.trim().toUpperCase(),
                address: request.address?.trim() || null,
                phoneNumber:
                    request.phoneNumber?.trim() || null,
                email: request.email?.trim() || null,
                firstName: request.firstName.trim(),
                lastName: request.lastName.trim(),
                username: request.username.trim(),
                adminEmail: request.adminEmail.trim(),
                adminPhone:
                    request.adminPhone?.trim() || null,
            }
        );

    return response.data;
}
