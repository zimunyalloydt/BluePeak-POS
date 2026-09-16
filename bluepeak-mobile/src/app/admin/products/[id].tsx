import { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import api from "../../../services/api";
import { getProduct } from "../../../services/productService";

const API_SERVER = "http://192.168.0.120:5160";

type Product = {
    productId: number;
    productCode: string;
    productName: string;
    barcode?: string | null;
    sellingPrice: number;
    costPrice: number;
    profit: number;
    quantityInStock?: number;
    isActive?: boolean;
    imageUrl?: string | null;
};

export default function AdminProductDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [productName, setProductName] = useState("");
    const [barcode, setBarcode] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [quantityInStock, setQuantityInStock] = useState("");
    const [isActive, setIsActive] = useState(true);

    const [selectedImage, setSelectedImage] = useState<any>(null);

    const loadProduct = useCallback(async () => {
        try {
            setLoading(true);

            const data = await getProduct(Number(id));

            setProduct(data);

            setProductName(data.productName ?? "");
            setBarcode(data.barcode ?? "");
            setSellingPrice(String(data.sellingPrice ?? 0));
            setCostPrice(String(data.costPrice ?? 0));
            setQuantityInStock(
                String(data.quantityInStock ?? 0)
            );
            setIsActive(data.isActive ?? true);
        } catch (error) {
            console.error("Failed to load product:", error);

            Alert.alert(
                "Error",
                "Failed to load product."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    const getImageUrl = () => {
        if (selectedImage?.uri) {
            return selectedImage.uri;
        }

        if (!product?.imageUrl) {
            return null;
        }

        if (product.imageUrl.startsWith("http")) {
            return product.imageUrl;
        }

        return `${API_SERVER}${product.imageUrl}`;
    };

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permission required",
                    "Please allow photo library access to select a product image."
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
                result.assets &&
                result.assets.length > 0
            ) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error(
                "Image picker error:",
                error
            );

            Alert.alert(
                "Error",
                "Could not select image."
            );
        }
    };

    const saveProduct = async () => {
        if (!product) {
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

        if (Number.isNaN(selling) || selling < 0) {
            Alert.alert(
                "Validation",
                "Enter a valid selling price."
            );
            return;
        }

        if (Number.isNaN(cost) || cost < 0) {
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
                    `product-${product.productId}.jpg`;

                const extension =
                    fileName.split(".").pop()?.toLowerCase();

                let mimeType = "image/jpeg";

                if (extension === "png") {
                    mimeType = "image/png";
                } else if (extension === "webp") {
                    mimeType = "image/webp";
                }

                formData.append("Image", {
                    uri,
                    name: fileName,
                    type: mimeType,
                } as any);
            }

            await api.put(
                `/Product/${product.productId}`,
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
                "Product updated successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error(
                "Failed to update product:",
                error?.response?.data || error
            );

            const message =
                error?.response?.data ||
                "Failed to update product.";

            Alert.alert(
                "Update Failed",
                typeof message === "string"
                    ? message
                    : "Failed to update product."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = () => {
        if (!product) {
            return;
        }

        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete "${product.productName}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(
                                `/Product/${product.productId}`
                            );

                            Alert.alert(
                                "Deleted",
                                "Product deleted successfully.",
                                [
                                    {
                                        text: "OK",
                                        onPress: () =>
                                            router.back(),
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error(
                                "Delete failed:",
                                error?.response?.data ||
                                    error
                            );

                            Alert.alert(
                                "Error",
                                "Failed to delete product."
                            );
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>
                    Loading product...
                </Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    Product not found.
                </Text>

                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>
                        Go Back
                    </Text>
                </Pressable>
            </View>
        );
    }

    const imageUrl = getImageUrl();

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
                    styles.scrollContent
                }
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backText}>
                            ← Back
                        </Text>
                    </Pressable>

                    <Text style={styles.title}>
                        Product Details
                    </Text>

                    <View style={{ width: 50 }} />
                </View>

                <View style={styles.imageSection}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
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
                        style={styles.changeImageButton}
                        onPress={pickImage}
                    >
                        <Text
                            style={
                                styles.changeImageText
                            }
                        >
                            {selectedImage
                                ? "Change Image"
                                : "Choose Image"}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Product Information
                    </Text>

                    <Text style={styles.label}>
                        Product Code
                    </Text>

                    <View style={styles.readOnlyField}>
                        <Text
                            style={
                                styles.readOnlyText
                            }
                        >
                            {product.productCode}
                        </Text>
                    </View>

                    <Text style={styles.label}>
                        Product Name
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="Product name"
                    />

                    <Text style={styles.label}>
                        Barcode
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={barcode}
                        onChangeText={setBarcode}
                        placeholder="Barcode"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Pricing
                    </Text>

                    <Text style={styles.label}>
                        Selling Price
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />

                    <Text style={styles.label}>
                        Cost Price
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
                                Inactive products cannot
                                be sold.
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
                        styles.saveButton,
                        saving &&
                            styles.disabledButton,
                    ]}
                    onPress={saveProduct}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text
                            style={
                                styles.saveButtonText
                            }
                        >
                            Save Changes
                        </Text>
                    )}
                </Pressable>

                <Pressable
                    style={styles.deleteButton}
                    onPress={deleteProduct}
                >
                    <Text
                        style={
                            styles.deleteButtonText
                        }
                    >
                        Delete Product
                    </Text>
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

    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fa",
        padding: 20,
    },

    loadingText: {
        marginTop: 12,
        color: "#64748b",
    },

    errorText: {
        fontSize: 17,
        color: "#dc2626",
        marginBottom: 20,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    backText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2563eb",
    },

    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
    },

    imageSection: {
        alignItems: "center",
        marginBottom: 20,
    },

    productImage: {
        width: 180,
        height: 180,
        borderRadius: 16,
        backgroundColor: "#e5e7eb",
    },

    imagePlaceholder: {
        width: 180,
        height: 180,
        borderRadius: 16,
        backgroundColor: "#e5e7eb",
        alignItems: "center",
        justifyContent: "center",
    },

    placeholderText: {
        color: "#64748b",
        fontWeight: "600",
    },

    changeImageButton: {
        marginTop: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#e0e7ff",
    },

    changeImageText: {
        color: "#3730a3",
        fontWeight: "700",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 16,
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

    readOnlyField: {
        height: 48,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 14,
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },

    readOnlyText: {
        color: "#64748b",
        fontWeight: "600",
    },

    profitBox: {
        marginTop: 16,
        padding: 14,
        borderRadius: 10,
        backgroundColor: "#f0fdf4",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    profitLabel: {
        color: "#166534",
        fontWeight: "700",
    },

    profitValue: {
        color: "#15803d",
        fontWeight: "800",
        fontSize: 17,
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
        maxWidth: 240,
    },

    saveButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: "#2563eb",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
    },

    disabledButton: {
        opacity: 0.6,
    },

    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },

    deleteButton: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#dc2626",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },

    deleteButtonText: {
        color: "#dc2626",
        fontSize: 16,
        fontWeight: "800",
    },

    backButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },

    backButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
});