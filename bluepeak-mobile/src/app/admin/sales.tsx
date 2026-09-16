import { View, Text, StyleSheet } from "react-native";

export default function AdminSales() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Sales Management
            </Text>

            <Text style={styles.text}>
                Sales management coming next.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fa",
        padding: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
    },

    text: {
        marginTop: 10,
        color: "#64748b",
    },
});