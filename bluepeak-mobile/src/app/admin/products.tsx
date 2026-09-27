import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import api from "../../services/api";

import {
    getProducts,
    searchProducts,
    Product,
} from "../../services/productService";

const API_SERVER = "http://192.168.0.217:5160";

export default function AdminProducts() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProducts = useCallback(async () => {
        try {
            const data = search.trim()
                ? await searchProducts(search.trim())
                : await getProducts();

            setProducts(data);
        } catch (error: any) {
            console.error(error);

            Alert.alert(
                "Error",
                "Failed to load products."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const run = async () => {
                // Defer so setState isn't called synchronously
                // within the focus effect callback
                await Promise.resolve();
                if (!cancelled) {
                    await loadProducts();
                }
            };

            run();

            return () => {
                cancelled = true;
            };
        }, [loadProducts])
    );

    const handleSearch = async (text: string) => {
        setSearch(text);

        if (!text.trim()) {
            // Clearing the search: reload the full list
            try {
                setLoading(true);

                const data = await getProducts();

                setProducts(data);
            } catch (error) {
                Alert.alert(
                    "Error",
                    "Failed to load products."
                );
            } finally {
                setLoading(false);
            }

            return;
        }

        try {
            const data = await searchProducts(
                text.trim()
            );

            setProducts(data);
        } catch (error) {
            Alert.alert(
                "Error",
                "Search failed."
            );
        }
    };

    const refresh = async () => {
        setRefreshing(true);
        await loadProducts();
    };

    const deleteProduct = (product: Product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete ${product.productName}?`,
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

                            setProducts((current) =>
                                current.filter(
                                    (item) =>
                                        item.productId !==
                                        product.productId
                                )
                            );

                            Alert.alert(
                                "Deleted",
                                "Product deleted successfully."
                            );
                        } catch (error) {
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

    const getImageUrl = (
        imageUrl?: string | null
    ) => {
        if (!imageUrl) {
            return null;
        }

        if (imageUrl.startsWith("http")) {
            return imageUrl;
        }

        return `${API_SERVER}${imageUrl}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                }
            >
                {/* HEADER */}

                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>
                            BLUEPEAK
                        </Text>

                        <Text style={styles.title}>
                            Products
                        </Text>

                        <Text style={styles.subtitle}>
                            Manage your product catalogue
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Text style={styles.backText}>
                            Back
                        </Text>
                    </Pressable>
                </View>

                {/* SEARCH */}

                <TextInput
                    value={search}
                    onChangeText={handleSearch}
                    placeholder="Search products..."
                    placeholderTextColor="#8A93A0"
                    style={styles.searchInput}
                />

                {/* SUMMARY */}

                <View style={styles.summary}>
                    <View>
                        <Text style={styles.summaryLabel}>
                            PRODUCTS
                        </Text>

                        <Text style={styles.summaryValue}>
                            {products.length}
                        </Text>
                    </View>

                    <Pressable
                        style={styles.addButton}
                        onPress={() =>
                            router.push("/admin/products/create")
                        }
                    >
                        <Text style={styles.addButtonText}>
                            + Add Product
                        </Text>
                    </Pressable>

                    <Pressable onPress={loadProducts}>
                        <Text style={styles.refreshText}>
                            Refresh
                        </Text>
                    </Pressable>
                </View>

                {/* PRODUCTS */}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />

                        <Text style={styles.loadingText}>
                            Loading products...
                        </Text>
                    </View>
                ) : products.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>
                            No products found
                        </Text>

                        <Text style={styles.emptyText}>
                            Try another search.
                        </Text>
                    </View>
                ) : (
                    products.map((product) => {
                        const imageUrl = getImageUrl(
                            product.imageUrl
                        );

                        return (
                            <View
                                key={product.productId}
                                style={styles.productCard}
                            >
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.productImage}
                                    />
                                ) : (
                                    <View style={styles.placeholder}>
                                        <Text
                                            style={
                                                styles.placeholderText
                                            }
                                        >
                                            BP
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.productInfo}>
                                    <View style={styles.nameRow}>
                                        <Text
                                            style={
                                                styles.productName
                                            }
                                        >
                                            {product.productName}
                                        </Text>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                product.isActive
                                                    ? styles.activeBadge
                                                    : styles.inactiveBadge,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    product.isActive
                                                        ? styles.activeText
                                                        : styles.inactiveText,
                                                ]}
                                            >
                                                {product.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text
                                        style={styles.productCode}
                                    >
                                        {product.productCode}
                                    </Text>

                                    {product.barcode && (
                                        <Text
                                            style={styles.barcode}
                                        >
                                            Barcode:{" "}
                                            {product.barcode}
                                        </Text>
                                    )}

                                    <View style={styles.details}>
                                        <View>
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Selling
                                            </Text>

                                            <Text
                                                style={
                                                    styles.detailValue
                                                }
                                            >
                                                $
                                                {Number(
                                                    product.sellingPrice
                                                ).toFixed(2)}
                                            </Text>
                                        </View>

                                        <View>
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Cost
                                            </Text>

                                            <Text
                                                style={
                                                    styles.detailValue
                                                }
                                            >
                                                $
                                                {Number(
                                                    product.costPrice
                                                ).toFixed(2)}
                                            </Text>
                                        </View>

                                        <View>
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Profit
                                            </Text>

                                            <Text
                                                style={
                                                    styles.profitValue
                                                }
                                            >
                                                $
                                                {Number(
                                                    product.profit
                                                ).toFixed(2)}
                                            </Text>
                                        </View>

                                        <View>
                                            <Text
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Stock
                                            </Text>

                                            <Text
                                                style={
                                                    styles.detailValue
                                                }
                                            >
                                                {product.quantityInStock ??
                                                    0}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.actions}>
                                        <Pressable
                                            style={
                                                styles.viewButton
                                            }
                                            onPress={() =>
                                                router.push(
                                                    `/admin/products/${product.productId}`
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.viewButtonText
                                                }
                                            >
                                                View
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            style={
                                                styles.deleteButton
                                            }
                                            onPress={() =>
                                                deleteProduct(
                                                    product
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.deleteButtonText
                                                }
                                            >
                                                Delete
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    content: {
        padding: 18,
        paddingBottom: 40,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 18,
    },

    brand: {
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 2,
        color: "#0B1F3A",
    },

    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#172033",
        marginTop: 3,
    },

    subtitle: {
        color: "#7B8492",
        fontSize: 12,
        marginTop: 3,
    },

    backButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDE2E8",
        borderRadius: 9,
        paddingHorizontal: 13,
        paddingVertical: 9,
    },

    backText: {
        color: "#1769E0",
        fontWeight: "700",
        fontSize: 12,
    },

    searchInput: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DEE3E9",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 13,
        color: "#172033",
        fontSize: 14,
        marginBottom: 15,
    },

    summary: {
        backgroundColor: "#FFFFFF",
        borderRadius: 13,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E1E5EA",
    },

    summaryLabel: {
        color: "#7B8492",
        fontSize: 9,
        fontWeight: "800",
    },

    summaryValue: {
        color: "#172033",
        fontSize: 23,
        fontWeight: "900",
        marginTop: 3,
    },

    refreshText: {
        color: "#1769E0",
        fontWeight: "800",
        fontSize: 12,
    },

    loadingContainer: {
        alignItems: "center",
        paddingVertical: 50,
    },

    loadingText: {
        color: "#7B8492",
        marginTop: 10,
    },

    emptyContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 35,
        alignItems: "center",
    },

    emptyTitle: {
        color: "#172033",
        fontWeight: "800",
        fontSize: 16,
    },

    emptyText: {
        color: "#7B8492",
        marginTop: 5,
    },

    productCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E1E5EA",
        flexDirection: "row",
    },

    productImage: {
        width: 105,
        height: 155,
        resizeMode: "cover",
    },

    placeholder: {
        width: 105,
        height: 155,
        backgroundColor: "#E9EEF5",
        alignItems: "center",
        justifyContent: "center",
    },

    placeholderText: {
        color: "#8190A5",
        fontWeight: "900",
        fontSize: 25,
    },

    productInfo: {
        flex: 1,
        padding: 13,
    },

    nameRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 6,
    },

    productName: {
        flex: 1,
        color: "#172033",
        fontSize: 15,
        fontWeight: "800",
    },

    productCode: {
        color: "#1769E0",
        fontSize: 10,
        fontWeight: "700",
        marginTop: 3,
    },

    barcode: {
        color: "#8A93A0",
        fontSize: 9,
        marginTop: 3,
    },

    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },

    activeBadge: {
        backgroundColor: "#E5F6EC",
    },

    inactiveBadge: {
        backgroundColor: "#FCE8E8",
    },

    statusText: {
        fontSize: 9,
        fontWeight: "800",
    },

    activeText: {
        color: "#16834A",
    },

    inactiveText: {
        color: "#D64545",
    },

    details: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 13,
    },

    detailLabel: {
        color: "#8A93A0",
        fontSize: 9,
    },

    detailValue: {
        color: "#172033",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 2,
    },

    profitValue: {
        color: "#16834A",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 2,
    },

    actions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 13,
    },

    viewButton: {
        flex: 1,
        backgroundColor: "#EAF1FF",
        borderRadius: 7,
        paddingVertical: 8,
        alignItems: "center",
    },

    viewButtonText: {
        color: "#1769E0",
        fontWeight: "800",
        fontSize: 11,
    },

    deleteButton: {
        flex: 1,
        backgroundColor: "#FCE8E8",
        borderRadius: 7,
        paddingVertical: 8,
        alignItems: "center",
    },

    deleteButtonText: {
        color: "#D64545",
        fontWeight: "800",
        fontSize: 11,
    },

    addButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 16,
    },

    addButtonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 15,
    },
});