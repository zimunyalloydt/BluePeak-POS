import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function DashboardScreen() {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                BLUEPEAK
            </Text>

            <Text style={styles.welcome}>
                Welcome, {user?.fullName}
            </Text>

            <Text style={styles.role}>
                Role: {user?.role}
            </Text>

            <Pressable
                style={styles.logout}
                onPress={logout}
            >
                <Text style={styles.logoutText}>
                    Logout
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#F4F6F8",
    },

    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#111827",
        textAlign: "center",
    },

    welcome: {
        marginTop: 20,
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        color: "#111827",
    },

    role: {
        marginTop: 10,
        textAlign: "center",
        color: "#6B7280",
        fontSize: 16,
    },

    logout: {
        marginTop: 30,
        height: 52,
        borderRadius: 12,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },

    logoutText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
});