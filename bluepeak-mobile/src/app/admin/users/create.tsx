import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { createAdminUser } from "../../../services/adminService";

export default function CreateUserScreen() {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState(3);
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !username.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert(
                "Missing Information",
                "Please complete all required fields."
            );
            return;
        }

        try {
            setLoading(true);

            await createAdminUser({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                roleId,
                isActive: true,
            });

            Alert.alert(
                "Success",
                "Staff member created successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error("Create user error:", error);

            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                "Failed to create staff member.";

            Alert.alert("Error", String(message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Add Staff Member</Text>
                    <Text style={styles.subtitle}>
                        Create a new staff account for your POS system.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter phone number"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <Text style={styles.label}>Username *</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email address"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                    />

                    <Text style={styles.sectionTitle}>Role</Text>

                    <View style={styles.roleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                roleId === 3 && styles.roleButtonActive,
                            ]}
                            onPress={() => setRoleId(3)}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    roleId === 3 && styles.roleTextActive,
                                ]}
                            >
                                Cashier
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                roleId === 2 && styles.roleButtonActive,
                            ]}
                            onPress={() => setRoleId(2)}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    roleId === 2 && styles.roleTextActive,
                                ]}
                            >
                                Manager
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.roleButton,
                                roleId === 1 && styles.roleButtonActive,
                            ]}
                            onPress={() => setRoleId(1)}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    roleId === 1 && styles.roleTextActive,
                                ]}
                            >
                                Admin
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            loading && styles.createButtonDisabled,
                        ]}
                        onPress={handleCreateUser}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.createButtonText}>
                                Create Staff Member
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    content: {
        padding: 20,
        paddingBottom: 40,
        width: "100%",
        maxWidth: 900,
        alignSelf: "center",
    },

    header: {
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111827",
    },

    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: "#6B7280",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginTop: 10,
        marginBottom: 16,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 7,
    },

    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#FFFFFF",
        marginBottom: 16,
    },

    roleContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 24,
    },

    roleButton: {
        flex: 1,
        minHeight: 48,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 8,
    },

    roleButtonActive: {
        backgroundColor: "#1769E0",
        borderColor: "#1769E0",
    },

    roleText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4B5563",
    },

    roleTextActive: {
        color: "#FFFFFF",
    },

    createButton: {
        height: 52,
        borderRadius: 10,
        backgroundColor: "#1769E0",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 4,
    },

    createButtonDisabled: {
        opacity: 0.7,
    },

    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    cancelButton: {
        height: 50,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },

    cancelButtonText: {
        color: "#6B7280",
        fontSize: 15,
        fontWeight: "600",
    },
});