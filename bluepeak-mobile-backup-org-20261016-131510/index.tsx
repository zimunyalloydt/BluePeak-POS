import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password) {
            Alert.alert(
                "Login required",
                "Please enter your username and password."
            );
            return;
        }

        try {
            setLoading(true);

            const loggedInUser = await login(
                username.trim(),
                password
            );

            const role = loggedInUser.role.toLowerCase();

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
                error?.response?.data ||
                    error?.message
            );

            let message =
                "Unable to connect to BluePeak.";

            if (error?.response?.status === 401) {
                message =
                    "Invalid username or password.";
            } else if (
                error?.message?.includes(
                    "No internet connection"
                )
            ) {
                message =
                    "You are offline and this account has not been successfully logged in on this device before.";
            }

            Alert.alert(
                "Login failed",
                message
            );
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
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>BLUEPEAK</Text>
                    <Text style={styles.subtitle}>POINT OF SALE</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Welcome back</Text>

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
                        style={styles.input}
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
                        style={styles.input}
                    />

                    <Pressable
                        style={[
                            styles.button,
                            loading && styles.buttonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading
                                ? "Signing in..."
                                : "Sign In"}
                        </Text>
                    </Pressable>
                </View>

                <Text style={styles.footer}>
                    BluePeak POS
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6F8",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
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