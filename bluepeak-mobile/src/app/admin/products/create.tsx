import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import api from "../../../services/api";

export default function CreateProduct() {
    const router = useRouter();

    const [productCode, setProductCode] = useState("");
    const [productName, setProductName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [quantityInStock, setQuantityInStock] =
        useState("0");

    const [isActive, setIsActive] = useState(true);

    const [selectedImage, setSelectedImage] =
        useState<any>(null);

    const [saving, setSaving] = useState(false);

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permission Required",
                    "Please allow access to your photos."
                );
                return;
            }

            const result =
                await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });

            if (
                !result.canceled &&
                result.assets?.length
            ) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error(error);

            Alert.alert(
                "Error",
                "Could not select image."
            );
        }
    };

    const createProduct = async () => {
        if (!productCode.trim()) {
            Alert.alert(
                "Validation",
                "Product code is required."
            );
            return;
        }

        if (!productName.trim()) {
            Alert.alert(
                "Validation",
                "Product name is required."
            );
            return;
        }

        const selling = Number(sellingPrice);
        const cost = Number(costPrice);
        const stock = Number(quantityInStock);

        if (
            Number.isNaN(selling) ||
            selling < 0
        ) {
            Alert.alert(
                "Validation",
                "Enter a valid selling price."
            );
            return;
        }

        if (
            Number.isNaN(cost) ||
            cost < 0
        ) {
            Alert.alert(
                "Validation",
                "Enter a valid cost price."
            );
            return;
        }

        if (
            Number.isNaN(stock) ||
            stock < 0 ||
            !Number.isInteger(stock)
        ) {
            Alert.alert(
                "Validation",
                "Stock must be a whole number."
            );
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();

            formData.append(
                "ProductCode",
                productCode.trim()
            );

            formData.append(
                "ProductName",
                productName.trim()
            );

            formData.append(
                "Barcode",
                barcode.trim()
            );

            formData.append(
                "SellingPrice",
                String(selling)
            );

            formData.append(
                "CostPrice",
                String(cost)
            );

            formData.append(
                "QuantityInStock",
                String(stock)
            );

            formData.append(
                "IsActive",
                String(isActive)
            );

            if (selectedImage?.uri) {
                const uri = selectedImage.uri;

                const fileName =
                    uri.split("/").pop() ||
                    "product.jpg";

                const extension =
                    fileName
                        .split(".")
                        .pop()
                        ?.toLowerCase();

                let mimeType = "image/jpeg";

                if (extension === "png") {
                    mimeType = "image/png";
                } else if (
                    extension === "webp"
                ) {
                    mimeType = "image/webp";
                }

                formData.append("Image", {
                    uri,
                    name: fileName,
                    type: mimeType,
                } as any);
            }

            await api.post(
                "/Product",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

            Alert.alert(
                "Success",
                "Product created successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.back();
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error(
                "Create product error:",
                error?.response?.data || error
            );

            const message =
                error?.response?.data ||
                "Failed to create product.";

            Alert.alert(
                "Create Product Failed",
                typeof message === "string"
                    ? message
                    : "Failed to create product."
            );
        } finally {
            setSaving(false);
        }
    };

    const profit =
        Number(sellingPrice || 0) -
        Number(costPrice || 0);

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
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                    >
                        <Text style={styles.back}>
                            ← Back
                        </Text>
                    </Pressable>

                    <Text style={styles.title}>
                        Add Product
                    </Text>

                    <View style={{ width: 50 }} />
                </View>

                <View style={styles.imageCard}>
                    {selectedImage?.uri ? (
                        <Image
                            source={{
                                uri: selectedImage.uri,
                            }}
                            style={styles.image}
                        />
                    ) : (
                        <View
                            style={
                                styles.imagePlaceholder
                            }
                        >
                            <Text
                                style={
                                    styles.placeholderText
                                }
                            >
                                No Image
                            </Text>
                        </View>
                    )}

                    <Pressable
                        style={styles.imageButton}
                        onPress={pickImage}
                    >
                        <Text
                            style={
                                styles.imageButtonText
                            }
                        >
                            {selectedImage
                                ? "Change Image"
                                : "Choose Product Image"}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Product Information
                    </Text>

                    <Text style={styles.label}>
                        Product Code *
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={productCode}
                        onChangeText={setProductCode}
                        placeholder="e.g. PROD001"
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>
                        Product Name *
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="e.g. Coca Cola 500ml"
                    />

                    <Text style={styles.label}>
                        Barcode
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={barcode}
                        onChangeText={setBarcode}
                        placeholder="Optional barcode"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Pricing
                    </Text>

                    <Text style={styles.label}>
                        Selling Price *
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.label}>
                        Cost Price *
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={costPrice}
                        onChangeText={setCostPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />

                    <View style={styles.profitBox}>
                        <Text style={styles.profitLabel}>
                            Profit per item
                        </Text>

                        <Text style={styles.profitValue}>
                            ${profit.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Inventory
                    </Text>

                    <Text style={styles.label}>
                        Quantity in Stock
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={quantityInStock}
                        onChangeText={
                            setQuantityInStock
                        }
                        placeholder="0"
                        keyboardType="number-pad"
                    />

                    <View style={styles.statusRow}>
                        <View>
                            <Text
                                style={
                                    styles.statusTitle
                                }
                            >
                                Product Active
                            </Text>

                            <Text
                                style={
                                    styles.statusDescription
                                }
                            >
                                Active products can be
                                sold.
                            </Text>
                        </View>

                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                        />
                    </View>
                </View>

                <Pressable
                    style={[
                        styles.createButton,
                        saving &&
                            styles.disabled,
                    ]}
                    onPress={createProduct}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator
                            color="#fff"
                        />
                    ) : (
                        <Text
                            style={
                                styles.createButtonText
                            }
                        >
                            Create Product
                        </Text>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },

    content: {
        padding: 20,
        paddingBottom: 50,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    back: {
        color: "#2563eb",
        fontWeight: "700",
        fontSize: 16,
    },

    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
    },

    imageCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        marginBottom: 16,
    },

    image: {
        width: 180,
        height: 180,
        borderRadius: 16,
    },

    imagePlaceholder: {
        width: 180,
        height: 180,
        borderRadius: 16,
        backgroundColor: "#e5e7eb",
        justifyContent: "center",
        alignItems: "center",
    },

    placeholderText: {
        color: "#64748b",
        fontWeight: "600",
    },

    imageButton: {
        marginTop: 12,
        backgroundColor: "#e0e7ff",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },

    imageButtonText: {
        color: "#3730a3",
        fontWeight: "700",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 14,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#475569",
        marginBottom: 7,
        marginTop: 10,
    },

    input: {
        height: 48,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#fff",
    },

    profitBox: {
        marginTop: 16,
        padding: 14,
        borderRadius: 10,
        backgroundColor: "#f0fdf4",
        flexDirection: "row",
        justifyContent: "space-between",
    },

    profitLabel: {
        color: "#166534",
        fontWeight: "700",
    },

    profitValue: {
        color: "#15803d",
        fontSize: 17,
        fontWeight: "800",
    },

    statusRow: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    statusTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },

    statusDescription: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 3,
    },

    createButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
    },

    disabled: {
        opacity: 0.6,
    },

    createButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },
});