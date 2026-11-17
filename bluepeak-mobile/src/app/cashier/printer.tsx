import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
    printerService,
    PrinterDevice,
    PrinterResult,
} from "../../services/printerService";

export default function PrinterScreen() {
    const router = useRouter();

    const [selectedPrinter, setSelectedPrinter] =
        useState<PrinterDevice | null>(null);

    const [pairedPrinters, setPairedPrinters] =
        useState<PrinterDevice[]>([]);

    const [foundPrinters, setFoundPrinters] =
        useState<PrinterDevice[]>([]);

    const [bluetoothEnabled, setBluetoothEnabled] =
        useState(false);

    const [connected, setConnected] = useState(false);

    const [scanning, setScanning] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [printing, setPrinting] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    const loadPrinterStatus = useCallback(async () => {
        try {
            setRefreshing(true);

            const saved = await printerService.getSelectedPrinter();

            setSelectedPrinter(saved);

            const enabled =
                await printerService.isBluetoothEnabled();

            setBluetoothEnabled(enabled);

            if (enabled) {
                const status = await printerService.isConnected();
                const device =
                    await printerService.getConnectedPrinter();

                setConnected(status);

                if (device) {
                    setSelectedPrinter((previous) => {
                        if (
                            previous &&
                            previous.address.toLowerCase() !==
                                device.address.toLowerCase()
                        ) {
                            return previous;
                        }

                        return device;
                    });
                }
            } else {
                setConnected(false);
            }
        } catch (error: any) {
            console.error("Printer status error:", error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadPrinterStatus();
        }, [loadPrinterStatus])
    );

    const handleScan = async () => {
        try {
            setScanning(true);

            setPairedPrinters([]);
            setFoundPrinters([]);

            const enabled =
                await printerService.isBluetoothEnabled();

            setBluetoothEnabled(enabled);

            if (!enabled) {
                Alert.alert(
                    "Bluetooth Disabled",
                    "Enable Bluetooth before searching for printers."
                );
                return;
            }

            const result: PrinterResult =
                await printerService.scanDevices();

            setPairedPrinters(result.paired ?? []);
            setFoundPrinters(result.found ?? []);

            if (
                result.paired.length === 0 &&
                result.found.length === 0
            ) {
                Alert.alert(
                    "No Devices Found",
                    "No Bluetooth devices were discovered. Make sure your printer is switched on and Bluetooth pairing is enabled."
                );
            }
        } catch (error: any) {
            console.error("Printer scan failed:", error);

            Alert.alert(
                "Scanning Failed",
                error?.message || "Unable to scan Bluetooth devices."
            );
        } finally {
            setScanning(false);
        }
    };

    const handleSelectPrinter = async (device: PrinterDevice) => {
        try {
            setConnecting(true);

            const result =
                await printerService.selectPrinter(device);

            setSelectedPrinter(result);
            setConnected(true);

            Alert.alert(
                "Printer Connected",
                `${device.name} has been selected successfully.`
            );
        } catch (error: any) {
            console.error("Printer connection failed:", error);

            setConnected(false);

            Alert.alert(
                "Connection Failed",
                error?.message ||
                    "Unable to connect to this printer."
            );
        } finally {
            setConnecting(false);
        }
    };

    const handleConnect = async () => {
        try {
            setConnecting(true);

            const device = await printerService.connect();

            setSelectedPrinter(device);
            setConnected(true);

            Alert.alert(
                "Connected",
                `${device.name} is ready for printing.`
            );
        } catch (error: any) {
            console.error("Printer reconnect failed:", error);

            setConnected(false);

            Alert.alert(
                "Connection Failed",
                error?.message || "Unable to reconnect to printer."
            );
        } finally {
            setConnecting(false);
        }
    };

    const handleTestPrint = async () => {
        try {
            setPrinting(true);

            await printerService.testPrint();

            setConnected(true);

            Alert.alert(
                "Test Successful",
                "The test receipt was sent successfully."
            );
        } catch (error: any) {
            console.error("Test printing failed:", error);

            setConnected(false);

            Alert.alert(
                "Printing Failed",
                error?.message || "Unable to print the test receipt."
            );
        } finally {
            setPrinting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setConnecting(true);

            await printerService.disconnect();

            setConnected(false);

            Alert.alert(
                "Disconnected",
                "The printer has been disconnected. Your saved printer selection has been retained."
            );
        } catch (error: any) {
            Alert.alert(
                "Disconnect Failed",
                error?.message || "Unable to disconnect printer."
            );
        } finally {
            setConnecting(false);
        }
    };

    const handleForgetPrinter = () => {
        Alert.alert(
            "Forget Printer",
            "This will remove the saved printer selection. You will need to select a printer again.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Forget",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setConnecting(true);

                            await printerService.forgetSelectedPrinter();

                            setSelectedPrinter(null);
                            setConnected(false);

                            Alert.alert(
                                "Printer Removed",
                                "The saved printer has been removed."
                            );
                        } catch (error: any) {
                            Alert.alert(
                                "Error",
                                error?.message ||
                                    "Unable to forget printer."
                            );
                        } finally {
                            setConnecting(false);
                        }
                    },
                },
            ]
        );
    };

    const renderPrinter = (device: PrinterDevice) => {
        const isSelected =
            selectedPrinter?.address.toLowerCase() ===
            device.address.toLowerCase();

        return (
            <View
                key={device.address}
                style={[
                    styles.deviceCard,
                    isSelected && styles.selectedDeviceCard,
                ]}
            >
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceIcon}>🖨️</Text>

                    <View style={styles.deviceDetails}>
                        <Text style={styles.deviceName}>
                            {device.name || "Unknown Bluetooth Device"}
                        </Text>

                        <Text style={styles.deviceAddress}>
                            {device.address}
                        </Text>

                        {isSelected && (
                            <Text style={styles.selectedLabel}>
                                {connected
                                    ? "✓ Selected • Connected"
                                    : "✓ Selected"}
                            </Text>
                        )}
                    </View>
                </View>

                <Pressable
                    style={[
                        styles.selectButton,
                        isSelected && styles.selectedButton,
                    ]}
                    disabled={connecting || isSelected}
                    onPress={() => handleSelectPrinter(device)}
                >
                    <Text style={styles.selectButtonText}>
                        {isSelected ? "Selected" : "Select"}
                    </Text>
                </Pressable>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backText}>‹</Text>
                </Pressable>

                <View>
                    <Text style={styles.headerTitle}>
                        Printer Settings
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Manage Bluetooth receipt printers
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* BLUETOOTH STATUS */}

                <View style={styles.bluetoothCard}>
                    <View style={styles.bluetoothInfo}>
                        <Text style={styles.bluetoothIcon}>ᛒ</Text>

                        <View>
                            <Text style={styles.sectionTitle}>
                                Bluetooth
                            </Text>

                            <Text style={styles.statusText}>
                                {refreshing
                                    ? "Checking status..."
                                    : bluetoothEnabled
                                    ? "Bluetooth is enabled"
                                    : "Bluetooth is disabled"}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.statusIndicator,
                            {
                                backgroundColor: bluetoothEnabled
                                    ? "#16A34A"
                                    : "#DC2626",
                            },
                        ]}
                    />
                </View>

                {/* CURRENT PRINTER */}

                <Text style={styles.sectionHeading}>
                    CURRENT PRINTER
                </Text>

                <View style={styles.currentPrinterCard}>
                    {selectedPrinter ? (
                        <>
                            <View style={styles.currentPrinterHeader}>
                                <Text style={styles.currentPrinterIcon}>
                                    🖨️
                                </Text>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.currentPrinterName}>
                                        {selectedPrinter.name}
                                    </Text>

                                    <Text style={styles.deviceAddress}>
                                        {selectedPrinter.address}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.connectionBadge,
                                        {
                                            backgroundColor: connected
                                                ? "#DCFCE7"
                                                : "#FEF3C7",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.connectionBadgeText,
                                            {
                                                color: connected
                                                    ? "#15803D"
                                                    : "#92400E",
                                            },
                                        ]}
                                    >
                                        {connected
                                            ? "Connected"
                                            : "Disconnected"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                {!connected ? (
                                    <Pressable
                                        style={styles.primaryButton}
                                        disabled={connecting}
                                        onPress={handleConnect}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {connecting
                                                ? "Connecting..."
                                                : "Connect"}
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        style={styles.primaryButton}
                                        disabled={printing}
                                        onPress={handleTestPrint}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {printing
                                                ? "Printing..."
                                                : "Test Print"}
                                        </Text>
                                    </Pressable>
                                )}

                                {connected && (
                                    <Pressable
                                        style={styles.secondaryButton}
                                        disabled={connecting}
                                        onPress={handleDisconnect}
                                    >
                                        <Text style={styles.secondaryButtonText}>
                                            Disconnect
                                        </Text>
                                    </Pressable>
                                )}
                            </View>

                            <Pressable
                                style={styles.forgetButton}
                                onPress={handleForgetPrinter}
                                disabled={connecting}
                            >
                                <Text style={styles.forgetButtonText}>
                                    Forget this printer
                                </Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🖨️</Text>

                            <Text style={styles.emptyTitle}>
                                No Printer Selected
                            </Text>

                            <Text style={styles.emptyDescription}>
                                Scan for Bluetooth printers and select one
                                to configure receipt printing.
                            </Text>
                        </View>
                    )}
                </View>

                {/* SCAN */}

                <View style={styles.scanHeader}>
                    <Text style={styles.sectionHeading}>
                        AVAILABLE PRINTERS
                    </Text>

                    <Pressable
                        style={styles.scanButton}
                        onPress={handleScan}
                        disabled={scanning || connecting}
                    >
                        {scanning ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.scanButtonText}>
                                ↻ Scan
                            </Text>
                        )}
                    </Pressable>
                </View>

                {scanning && (
                    <Text style={styles.scanningText}>
                        Searching for Bluetooth devices...
                    </Text>
                )}

                {/* PAIRED DEVICES */}

                <Text style={styles.subheading}>
                    PAIRED DEVICES
                </Text>

                {pairedPrinters.length > 0 ? (
                    pairedPrinters.map(renderPrinter)
                ) : (
                    <Text style={styles.noDevices}>
                        No paired devices found.
                    </Text>
                )}

                {/* DISCOVERED DEVICES */}

                <Text style={styles.subheading}>
                    NEWLY DISCOVERED DEVICES
                </Text>

                {foundPrinters.length > 0 ? (
                    foundPrinters.map(renderPrinter)
                ) : (
                    <Text style={styles.noDevices}>
                        No new devices discovered.
                    </Text>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        BluePeak POS • Bluetooth Printer Management
                    </Text>
                </View>
            </ScrollView>

            {(connecting || printing) && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />

                    <Text style={styles.loadingText}>
                        {printing
                            ? "Printing test receipt..."
                            : "Connecting to printer..."}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    backButton: {
        marginRight: 16,
    },

    backText: {
        fontSize: 38,
        color: "#111827",
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },

    headerSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 3,
    },

    content: {
        padding: 18,
        paddingBottom: 40,
    },

    bluetoothCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 18,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        marginBottom: 25,
    },

    bluetoothInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    bluetoothIcon: {
        fontSize: 28,
        color: "#2563EB",
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },

    statusText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },

    statusIndicator: {
        width: 11,
        height: 11,
        borderRadius: 6,
    },

    sectionHeading: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        color: "#64748B",
        marginBottom: 12,
    },

    currentPrinterCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 18,
        marginBottom: 28,
    },

    currentPrinterHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    currentPrinterIcon: {
        fontSize: 30,
    },

    currentPrinterName: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 5,
    },

    deviceAddress: {
        fontSize: 11,
        color: "#64748B",
    },

    connectionBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },

    connectionBadgeText: {
        fontSize: 10,
        fontWeight: "800",
    },

    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 22,
    },

    primaryButton: {
        flex: 1,
        backgroundColor: "#1D4ED8",
        padding: 13,
        borderRadius: 9,
        alignItems: "center",
    },

    primaryButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },

    secondaryButton: {
        flex: 1,
        backgroundColor: "#F1F5F9",
        padding: 13,
        borderRadius: 9,
        alignItems: "center",
    },

    secondaryButtonText: {
        color: "#334155",
        fontWeight: "700",
        fontSize: 13,
    },

    forgetButton: {
        marginTop: 17,
        alignItems: "center",
    },

    forgetButtonText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "700",
    },

    emptyState: {
        alignItems: "center",
        paddingVertical: 25,
    },

    emptyIcon: {
        fontSize: 38,
        marginBottom: 12,
    },

    emptyTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#111827",
    },

    emptyDescription: {
        fontSize: 12,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 19,
        marginTop: 8,
    },

    scanHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },

    scanButton: {
        backgroundColor: "#1D4ED8",
        paddingHorizontal: 17,
        paddingVertical: 10,
        borderRadius: 9,
    },

    scanButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
    },

    scanningText: {
        color: "#2563EB",
        fontSize: 12,
        marginBottom: 15,
    },

    subheading: {
        fontSize: 11,
        fontWeight: "800",
        color: "#64748B",
        marginBottom: 12,
        marginTop: 8,
    },

    deviceCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },

    selectedDeviceCard: {
        borderWidth: 1,
        borderColor: "#2563EB",
    },

    deviceInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
    },

    deviceIcon: {
        fontSize: 25,
    },

    deviceDetails: {
        flex: 1,
    },

    deviceName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 5,
    },

    selectedLabel: {
        fontSize: 10,
        color: "#15803D",
        fontWeight: "800",
        marginTop: 5,
    },

    selectButton: {
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 8,
        marginLeft: 8,
    },

    selectedButton: {
        backgroundColor: "#DCFCE7",
    },

    selectButtonText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#1D4ED8",
    },

    noDevices: {
        fontSize: 12,
        color: "#94A3B8",
        marginBottom: 20,
    },

    footer: {
        marginTop: 30,
        alignItems: "center",
    },

    footerText: {
        color: "#94A3B8",
        fontSize: 10,
    },

    loadingOverlay: {
       ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(15,23,42,0.75)",
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 14,
    },
});