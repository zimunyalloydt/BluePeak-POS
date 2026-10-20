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
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { login } = useAuth();

    const [organisationCode, setOrganisationCode] =
        useState("COLDSTONE");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (
            !organisationCode.trim() ||
            !username.trim() ||
            !password
        ) {
            Alert.alert(
                "Login required",
                "Please enter your organisation code, username and password."
            );
            return;
        }

        try {
            setLoading(true);

            const loggedInUser = await login(
                organisationCode.trim().toUpperCase(),
                username.trim(),
                password
            );

            const role = String(
                loggedInUser.role ?? ""
            ).toLowerCase();

            console.log("LOGIN NAVIGATION:", {
                role,
                organisationId:
                    loggedInUser.organisationId,
                organisationCode:
                    loggedInUser.organisationCode,
            });

            if (role === "cashier") {
                router.replace("/cashier");
            } else if (role === "manager") {
                router.replace("/manager");
            } else if (
                role === "admin" ||
                role === "administrator"
            ) {
                router.replace("/admin");
            } else {
                router.replace("/dashboard");
            }
        } catch (error: any) {
            console.log(
                "LOGIN ERROR:",
                error?.response?.data || error?.message
            );

            let message =
                "Unable to connect to BluePeak.";

            if (error?.response?.status === 401) {
                message =
                    "Invalid organisation code, username or password. Check your details and try again.";
            } else if (
                error?.message?.includes(
                    "no matching offline account"
                )
            ) {
                message =
                    "You are offline, and this organisation account has not been configured for offline login on this device.";
            } else if (
                error?.message?.includes(
                    "Network Error"
                ) ||
                error?.message?.includes(
                    "Network request failed"
                ) ||
                error?.message?.includes(
                    "Unable to connect"
                )
            ) {
                message =
                    "Unable to reach the server. Check your network connection or try your previously cached offline account.";
            } else if (
                error?.message?.includes(
                    "Organisation code, username and password are required"
                )
            ) {
                message =
                    "Please enter your organisation code, username and password.";
            }

            Alert.alert("Login failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>
                            BLUEPEAK
                        </Text>

                        <Text style={styles.subtitle}>
                            POINT OF SALE
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Welcome back
                        </Text>

                        <Text style={styles.label}>
                            Organisation Code
                        </Text>

                        <TextInput
                            value={organisationCode}
                            onChangeText={setOrganisationCode}
                            placeholder="Enter organisation code"
                            placeholderTextColor="#8B8B8B"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoComplete="off"
                            style={styles.input}
                            editable={!loading}
                            returnKeyType="next"
                        />

                        <Text style={styles.label}>
                            Username
                        </Text>

                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter your username"
                            placeholderTextColor="#8B8B8B"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="username"
                            style={styles.input}
                            editable={!loading}
                            returnKeyType="next"
                        />

                        <Text style={styles.label}>
                            Password
                        </Text>

                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor="#8B8B8B"
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="current-password"
                            style={styles.input}
                            editable={!loading}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />

                        <Pressable
                            style={[
                                styles.button,
                                loading && styles.buttonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Sign In
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={styles.registerButton}
                            onPress={() =>
                                router.push(
                                    "/register-organisation"
                                )
                            }
                            disabled={loading}
                            accessibilityRole="button"
                        >
                            <Text
                                style={
                                    styles.registerButtonText
                                }
                            >
                                Register Your Organisation
                            </Text>
                        </Pressable>

                        <Text style={styles.registerHint}>
                            New to BluePeak? Set up your
                            business account.
                        </Text>
                    </View>

                    <Text style={styles.footer}>
                        BluePeak POS
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6F8",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 35,
    },
    logo: {
        fontSize: 34,
        fontWeight: "900",
        letterSpacing: 2,
        color: "#111827",
    },
    subtitle: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 3,
        color: "#6B7280",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#111827",
        marginBottom: 18,
        backgroundColor: "#FAFAFA",
    },
    button: {
        height: 52,
        borderRadius: 12,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    registerButton: {
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    registerButtonText: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "800",
    },
    registerHint: {
        color: "#6B7280",
        fontSize: 12,
        textAlign: "center",
        marginTop: 10,
        lineHeight: 18,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    footer: {
        textAlign: "center",
        marginTop: 30,
        color: "#9CA3AF",
        fontSize: 13,
    },
});