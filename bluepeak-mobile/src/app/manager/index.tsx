import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

export default function ManagerDashboard() {
    const { user, logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.brand}>
                BLUEPEAK
            </Text>

            <Text style={styles.title}>
                Manager Dashboard
            </Text>

            <Text style={styles.welcome}>
                Welcome, {user?.fullName}
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Sales
                </Text>

                <Text style={styles.cardText}>
                    Monitor sales and performance.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Products
                </Text>

                <Text style={styles.cardText}>
                    Manage your product catalogue.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Tasks
                </Text>

                <Text style={styles.cardText}>
                    Manage staff tasks.
                </Text>
            </View>

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
        backgroundColor: "#F4F6F8",
    },

    brand: {
        fontSize: 26,
        fontWeight: "900",
        color: "#111827",
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        marginTop: 8,
        color: "#111827",
    },

    welcome: {
        marginTop: 8,
        marginBottom: 25,
        color: "#6B7280",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
    },

    cardTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#111827",
    },

    cardText: {
        marginTop: 6,
        color: "#6B7280",
    },

    logout: {
        marginTop: "auto",
        height: 52,
        borderRadius: 12,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
    },

    logoutText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 16,
    },
});