import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { router } from "expo-router";

import {
    registerOrganisation,
} from "../services/organisationRegistrationService";

export default function RegisterOrganisationScreen() {
    const [organisationName, setOrganisationName] = useState("");
    const [organisationCode, setOrganisationCode] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [businessEmail, setBusinessEmail] = useState("");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleRegistration = async () => {
        const code = organisationCode.trim().toUpperCase();

        if (
            !organisationName.trim() ||
            !code ||
            !firstName.trim() ||
            !lastName.trim() ||
            !username.trim() ||
            !adminEmail.trim() ||
            !password ||
            !confirmPassword
        ) {
            Alert.alert(
                "Required information",
                "Complete all required business and administrator fields."
            );
            return;
        }

        if (organisationName.trim().length < 2) {
            Alert.alert(
                "Invalid organisation name",
                "The organisation name must contain at least 2 characters."
            );
            return;
        }

        if (!/^[A-Z0-9-]{3,30}$/.test(code)) {
            Alert.alert(
                "Invalid organisation code",
                "Use 3–30 letters, numbers or hyphens."
            );
            return;
        }

        if (username.trim().length < 3) {
            Alert.alert(
                "Invalid username",
                "The administrator username must contain at least 3 characters."
            );
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                "Weak password",
                "Use a password containing at least 8 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                "Passwords do not match",
                "Enter the same password in both password fields."
            );
            return;
        }

        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!validEmail.test(adminEmail.trim())) {
            Alert.alert(
                "Invalid administrator email",
                "Enter a valid administrator email address."
            );
            return;
        }

        if (
            businessEmail.trim() &&
            !validEmail.test(businessEmail.trim())
        ) {
            Alert.alert(
                "Invalid business email",
                "Enter a valid business email address."
            );
            return;
        }

        try {
            setLoading(true);

            const result = await registerOrganisation({
                organisationName: organisationName.trim(),
                organisationCode: code,
                address: address.trim() || undefined,
                phoneNumber: phoneNumber.trim() || undefined,
                email: businessEmail.trim() || undefined,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                password,
                adminEmail: adminEmail.trim(),
                adminPhone: adminPhone.trim() || undefined,
            });

            if (!result.success) {
                Alert.alert(
                    "Registration unsuccessful",
                    result.message ||
                        "The organisation could not be registered."
                );
                return;
            }

            Alert.alert(
                "Registration successful",
                `${result.organisationName || organisationName.trim()} has been registered.\n\n` +
                    `Organisation code: ${result.organisationCode || code}\n` +
                    `Administrator username: ${result.adminUsername || username.trim()}\n\n` +
                    "You can now sign in to BluePeak POS.",
                [
                    {
                        text: "Go to Login",
                        onPress: () => router.replace("/"),
                    },
                ],
                { cancelable: false }
            );
        } catch (error: any) {
            console.error(
                "ORGANISATION REGISTRATION ERROR:",
                error?.response?.data || error?.message
            );

            const responseData = error?.response?.data;

            let message =
                "Unable to register the organisation. Check your connection and try again.";

            if (error?.response?.status === 409) {
                message =
                    responseData?.message ||
                    "That organisation code is already registered. Choose another code.";
            } else if (error?.response?.status === 400) {
                const errors = responseData?.errors;

                if (errors && typeof errors === "object") {
                    message = Object.values(errors)
                        .flat()
                        .filter(
                            (value): value is string =>
                                typeof value === "string"
                        )
                        .join("\n");
                } else {
                    message =
                        responseData?.message ||
                        responseData?.title ||
                        "Some registration details are invalid. Check the form and try again.";
                }
            } else if (!error?.response) {
                message =
                    "Could not reach the BluePeak server. Check your network connection and try again.";
            }

            Alert.alert("Registration failed", message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        label: string,
        value: string,
        onChangeText: (text: string) => void,
        placeholder: string,
        options?: {
            required?: boolean;
            secure?: boolean;
            email?: boolean;
            phone?: boolean;
            multiline?: boolean;
            uppercase?: boolean;
        }
    ) => (
        <View style={styles.field} key={label}>
            <Text style={styles.label}>
                {label}
                {options?.required ? " *" : ""}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                style={[
                    styles.input,
                    options?.multiline && styles.multilineInput,
                ]}
                editable={!loading}
                secureTextEntry={options?.secure}
                keyboardType={
                    options?.email
                        ? "email-address"
                        : options?.phone
                          ? "phone-pad"
                          : "default"
                }
                autoCapitalize={
                    options?.email
                        ? "none"
                        : options?.uppercase
                          ? "characters"
                          : "words"
                }
                autoCorrect={false}
                multiline={options?.multiline}
                textAlignVertical={
                    options?.multiline ? "top" : "center"
                }
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>BLUEPEAK</Text>
                    <Text style={styles.subtitle}>POINT OF SALE</Text>
                    <Text style={styles.heading}>
                        Register your organisation
                    </Text>
                    <Text style={styles.description}>
                        Set up your business and create its first administrator
                        account.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Business details
                    </Text>

                    {renderInput(
                        "Organisation name",
                        organisationName,
                        setOrganisationName,
                        "e.g. Example Trading",
                        { required: true }
                    )}

                    {renderInput(
                        "Organisation code",
                        organisationCode,
                        setOrganisationCode,
                        "e.g. EXAMPLE001",
                        { required: true, uppercase: true }
                    )}

                    <Text style={styles.hint}>
                        This code is required whenever you sign in. Keep it
                        somewhere safe and share it only with authorised staff.
                    </Text>

                    {renderInput(
                        "Business phone",
                        phoneNumber,
                        setPhoneNumber,
                        "Enter business phone",
                        { phone: true }
                    )}

                    {renderInput(
                        "Business email",
                        businessEmail,
                        setBusinessEmail,
                        "business@example.com",
                        { email: true }
                    )}

                    {renderInput(
                        "Business address",
                        address,
                        setAddress,
                        "Enter business address",
                        { multiline: true }
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>
                        Administrator account
                    </Text>

                    {renderInput(
                        "First name",
                        firstName,
                        setFirstName,
                        "Enter first name",
                        { required: true }
                    )}

                    {renderInput(
                        "Last name",
                        lastName,
                        setLastName,
                        "Enter last name",
                        { required: true }
                    )}

                    {renderInput(
                        "Username",
                        username,
                        setUsername,
                        "Choose a username",
                        { required: true }
                    )}

                    {renderInput(
                        "Administrator email",
                        adminEmail,
                        setAdminEmail,
                        "admin@example.com",
                        { required: true, email: true }
                    )}

                    {renderInput(
                        "Administrator phone",
                        adminPhone,
                        setAdminPhone,
                        "Enter phone number",
                        { phone: true }
                    )}

                    {renderInput(
                        "Password",
                        password,
                        setPassword,
                        "At least 8 characters",
                        { required: true, secure: true }
                    )}

                    {renderInput(
                        "Confirm password",
                        confirmPassword,
                        setConfirmPassword,
                        "Re-enter password",
                        { required: true, secure: true }
                    )}

                    <Text style={styles.hint}>
                        Fields marked with * are required.
                    </Text>

                    <Pressable
                        style={[
                            styles.button,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleRegistration}
                        disabled={loading}
                        accessibilityRole="button"
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color="#FFFFFF" />
                                <Text style={styles.buttonText}>
                                    {"  "}Registering...
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>
                                Register Organisation
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => router.replace("/")}
                        disabled={loading}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Already registered? Sign in
                        </Text>
                    </Pressable>
                </View>

                <Text style={styles.footer}>BluePeak POS</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F5F8",
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 28,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
        marginTop: 12,
    },
    logo: {
        color: "#111827",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 2,
    },
    subtitle: {
        color: "#6B7280",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 3,
        marginTop: 4,
    },
    heading: {
        color: "#111827",
        fontSize: 25,
        fontWeight: "800",
        marginTop: 25,
        textAlign: "center",
    },
    description: {
        color: "#6B7280",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8,
        maxWidth: 340,
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 22,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionTitle: {
        color: "#111827",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 18,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 7,
    },
    input: {
        minHeight: 49,
        borderColor: "#D1D5DB",
        borderWidth: 1,
        borderRadius: 10,
        color: "#111827",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 13,
        fontSize: 15,
    },
    multilineInput: {
        minHeight: 85,
        paddingTop: 12,
    },
    hint: {
        color: "#6B7280",
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 16,
        marginTop: -4,
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 22,
    },
    button: {
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "#111827",
        marginTop: 8,
        paddingHorizontal: 12,
    },
    buttonDisabled: {
        opacity: 0.65,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButton: {
        alignItems: "center",
        paddingVertical: 17,
    },
    secondaryButtonText: {
        color: "#1D4ED8",
        fontSize: 14,
        fontWeight: "700",
    },
    footer: {
        color: "#9CA3AF",
        fontSize: 12,
        textAlign: "center",
        marginTop: 22,
    },
});
