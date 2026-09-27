import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { useRouter } from "expo-router";

import TaskAlertModal from "../../components/TaskAlertModal";
import {
    startNotificationConnection,
    stopNotificationConnection,
} from "../../services/notificationService";
import {
    completeTask,
    getMyTasks,
    Task,
} from "../../services/taskService";
import { useAuth } from "../../context/AuthContext";
import {
    getProducts,
    Product,
} from "../../services/productService";
import { createSale } from "../../services/salesService";

type CartItem = {
    product: Product;
    quantity: number;
};

const API_SERVER = "http://192.168.0.217:5160";

export default function CashierScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();

    const numColumns = width >= 768 ? 3 : 2;

    const scrollViewRef = useRef<ScrollView>(null);
    const checkoutY = useRef(0);

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);
    const [quantityInput, setQuantityInput] = useState("1");
    const [quantityModalVisible, setQuantityModalVisible] =
        useState(false);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [completingTask, setCompletingTask] = useState(false);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [processingSale, setProcessingSale] = useState(false);

    const [amountPaid, setAmountPaid] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    // ---- Products -------------------------------------------------------

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load products:", error);
            Alert.alert("Error", "Failed to load products.");
        } finally {
            setLoading(false);
        }
    }, []);

    // ---- Tasks ----------------------------------------------------------

    const loadTasks = useCallback(async () => {
        try {
            const data = await getMyTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load cashier tasks:", error);
        }
    }, []);

    // ---- Notifications --------------------------------------------------

    useEffect(() => {
        if (!user?.userId) {
            return;
        }

        let mounted = true;

        const connectNotifications = async () => {
            try {
                await startNotificationConnection(
                    user.userId,
                    async (notification) => {
                        if (!mounted) return;

                        console.log(
                            "📩 Cashier notification:",
                            notification
                        );

                        if (
                            notification?.Type === "Task" ||
                            notification?.type === "Task"
                        ) {
                            console.log(
                                "🚨 New task received instantly."
                            );

                            const latestTasks = await getMyTasks();

                            if (mounted) {
                                setTasks(
                                    Array.isArray(latestTasks)
                                        ? latestTasks
                                        : []
                                );
                            }
                        }
                    }
                );
            } catch (error) {
                console.error(
                    "Failed to connect to notifications:",
                    error
                );
            }
        };

        connectNotifications();

        return () => {
            mounted = false;
            stopNotificationConnection();
        };
    }, [user?.userId]);

    // ---- Initial load ---------------------------------------------------

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getProducts();
                if (!cancelled) {
                    setProducts(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to load products:",
                        error
                    );
                    Alert.alert("Error", "Failed to load products.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        loadTasks();

        return () => {
            cancelled = true;
        };
    }, [loadTasks]);

    const activeTask = useMemo(
        () =>
            tasks.find(
                (task) =>
                    String(task.status ?? "").toLowerCase() !==
                    "completed"
            ) ?? null,
        [tasks]
    );

    const handleCompleteTask = async () => {
        if (!activeTask) return;

        try {
            setCompletingTask(true);

            await completeTask(activeTask.taskItemId);

            setTasks((currentTasks) =>
                currentTasks.map((task) =>
                    task.taskItemId === activeTask.taskItemId
                        ? { ...task, status: "Completed" }
                        : task
                )
            );
        } catch (error) {
            console.error("Failed to complete task:", error);
            Alert.alert(
                "Unable to Complete Task",
                "The task could not be completed. Please try again."
            );
        } finally {
            setCompletingTask(false);
        }
    };

    // ---- Product filtering ----------------------------------------------

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;

        return products.filter((product) => {
            const name = String(
                product.productName ?? ""
            ).toLowerCase();
            const code = String(
                product.productCode ?? ""
            ).toLowerCase();
            const barcode = String(
                product.barcode ?? ""
            ).toLowerCase();

            return (
                name.includes(query) ||
                code.includes(query) ||
                barcode.includes(query)
            );
        });
    }, [products, search]);

    // ---- Cart -----------------------------------------------------------

    const addToCart = (product: Product, quantity: number) => {
        if (quantity <= 0) return;

        setCart((currentCart) => {
            const existing = currentCart.find(
                (item) =>
                    item.product.productId === product.productId
            );

            if (existing) {
                return currentCart.map((item) =>
                    item.product.productId === product.productId
                        ? {
                              ...item,
                              quantity: item.quantity + quantity,
                          }
                        : item
                );
            }

            return [...currentCart, { product, quantity }];
        });

        setQuantityModalVisible(false);
        setSelectedProduct(null);
        setQuantityInput("1");
    };

    const openQuantityModal = (product: Product) => {
        setSelectedProduct(product);
        setQuantityInput("1");
        setQuantityModalVisible(true);
    };

    const increaseModalQuantity = () => {
        const current = Number(quantityInput) || 0;
        setQuantityInput(String(current + 1));
    };

    const decreaseModalQuantity = () => {
        const current = Number(quantityInput) || 1;
        if (current > 1) {
            setQuantityInput(String(current - 1));
        }
    };

    const confirmQuantity = () => {
        if (!selectedProduct) return;

        const quantity = Number(quantityInput);

        if (!Number.isInteger(quantity) || quantity <= 0) {
            Alert.alert(
                "Invalid Quantity",
                "Please enter a valid quantity."
            );
            return;
        }

        addToCart(selectedProduct, quantity);
    };

    const removeFromCart = (productId: number) => {
        setCart((currentCart) =>
            currentCart.filter(
                (item) => item.product.productId !== productId
            )
        );
    };

    const increaseQuantity = (productId: number) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.product.productId === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const decreaseQuantity = (productId: number) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.product.productId === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const cartTotal = useMemo(
        () =>
            cart.reduce(
                (total, item) =>
                    total +
                    item.product.sellingPrice * item.quantity,
                0
            ),
        [cart]
    );

    const parsedAmountPaid = parseFloat(amountPaid) || 0;
    const change = parsedAmountPaid - cartTotal;

    // ---- Checkout -------------------------------------------------------

    const completeSale = async () => {
        if (!user) {
            Alert.alert("Session Error", "Please log in again.");
            return;
        }

        if (cart.length === 0) {
            Alert.alert("Empty Cart", "Add at least one product.");
            return;
        }

        if (parsedAmountPaid < cartTotal) {
            Alert.alert(
                "Insufficient Payment",
                `Amount paid must be at least $${cartTotal.toFixed(
                    2
                )}.`
            );
            return;
        }

        try {
            setProcessingSale(true);

            const result = await createSale({
                userId: user.userId,
                paymentMethod,
                amountPaid: parsedAmountPaid,
                customerName: customerName.trim() || undefined,
                items: cart.map((item) => ({
                    productId: item.product.productId,
                    quantity: item.quantity,
                })),
            });

            Alert.alert(
                "Sale Complete",
                `Sale #${result.saleId} completed successfully.\n\nChange: $${change.toFixed(
                    2
                )}`,
                [
                    {
                        text: "New Sale",
                        onPress: () => {
                            setCart([]);
                            setAmountPaid("");
                            setCustomerName("");
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error("Sale failed:", error);
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                "Failed to complete sale.";
            Alert.alert("Sale Failed", String(message));
        } finally {
            setProcessingSale(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    // ---- Helpers --------------------------------------------------------

    const getImageUrl = (imageUrl?: string | null) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith("http")) return imageUrl;
        return `${API_SERVER}${imageUrl}`;
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const imageUrl = getImageUrl(item.imageUrl);

        return (
            <Pressable
                style={styles.productCard}
                onPress={() => openQuantityModal(item)}
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                    />
                ) : (
                    <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImageText}>
                            BP
                        </Text>
                    </View>
                )}

                <View style={styles.productCardContent}>
                    <Text
                        style={styles.productName}
                        numberOfLines={1}
                    >
                        {item.productName}
                    </Text>
                    <Text
                        style={styles.productCode}
                        numberOfLines={1}
                    >
                        {item.productCode}
                    </Text>
                    <Text style={styles.productPrice}>
                        ${Number(item.sellingPrice).toFixed(2)}
                    </Text>
                </View>
            </Pressable>
        );
    };

    // ---- Render ---------------------------------------------------------

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={
                    Platform.OS === "ios" ? "padding" : "height"
                }
                keyboardVerticalOffset={
                    Platform.OS === "ios" ? 0 : 20
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>BLUEPEAK</Text>
                        <Text style={styles.headerTitle}>
                            Cashier POS
                        </Text>
                    </View>

                    <View style={styles.headerRight}>
                        <View>
                            <Text style={styles.userName}>
                                {user?.fullName}
                            </Text>
                            <Text style={styles.userRole}>
                                Cashier
                            </Text>
                        </View>

                        <Pressable
                            onPress={handleLogout}
                            style={styles.logoutButton}
                        >
                            <Text style={styles.logoutText}>
                                Logout
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    keyboardDismissMode="interactive"
                >
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by name, code, or barcode..."
                        placeholderTextColor="#8A8F98"
                        style={styles.searchInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                Products
                            </Text>
                            <Text style={styles.sectionSubtitle}>
                                Tap a product to add it
                            </Text>
                        </View>

                        <Pressable onPress={loadProducts}>
                            <Text style={styles.refreshText}>
                                Refresh
                            </Text>
                        </Pressable>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                            <Text style={styles.loadingText}>
                                Loading products...
                            </Text>
                        </View>
                    ) : filteredProducts.length === 0 ? (
                        <View style={styles.emptyProducts}>
                            <Text style={styles.emptyTitle}>
                                No products found
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                Try another search.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            key={numColumns}
                            data={filteredProducts}
                            renderItem={renderProduct}
                            keyExtractor={(item) =>
                                item.productId.toString()
                            }
                            numColumns={numColumns}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.productRow}
                        />
                    )}

                    <View style={styles.cartSection}>
                        <View style={styles.cartHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>
                                    Current Sale
                                </Text>
                                <Text
                                    style={styles.sectionSubtitle}
                                >
                                    {cart.length} item
                                    {cart.length !== 1 ? "s" : ""}
                                </Text>
                            </View>

                            {cart.length > 0 && (
                                <Pressable
                                    onPress={() => setCart([])}
                                >
                                    <Text style={styles.clearText}>
                                        Clear
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {cart.length === 0 ? (
                            <View style={styles.emptyCart}>
                                <Text
                                    style={styles.emptyCartTitle}
                                >
                                    Cart is empty
                                </Text>
                                <Text style={styles.emptyCartText}>
                                    Tap products above to add them.
                                </Text>
                            </View>
                        ) : (
                            cart.map((item) => (
                                <View
                                    key={item.product.productId}
                                    style={styles.cartItem}
                                >
                                    <View
                                        style={styles.cartItemInfo}
                                    >
                                        <Text
                                            style={
                                                styles.cartItemName
                                            }
                                        >
                                            {
                                                item.product
                                                    .productName
                                            }
                                        </Text>
                                        <Text
                                            style={
                                                styles.cartItemPrice
                                            }
                                        >
                                            $
                                            {Number(
                                                item.product
                                                    .sellingPrice
                                            ).toFixed(2)}{" "}
                                            each
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.quantityControls
                                        }
                                    >
                                        <Pressable
                                            onPress={() =>
                                                decreaseQuantity(
                                                    item.product
                                                        .productId
                                                )
                                            }
                                            style={
                                                styles.quantityButton
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.quantityButtonText
                                                }
                                            >
                                                −
                                            </Text>
                                        </Pressable>

                                        <Text
                                            style={
                                                styles.quantityText
                                            }
                                        >
                                            {item.quantity}
                                        </Text>

                                        <Pressable
                                            onPress={() =>
                                                increaseQuantity(
                                                    item.product
                                                        .productId
                                                )
                                            }
                                            style={
                                                styles.quantityButton
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.quantityButtonText
                                                }
                                            >
                                                +
                                            </Text>
                                        </Pressable>
                                    </View>

                                    <Text
                                        style={styles.cartItemTotal}
                                    >
                                        $
                                        {(
                                            item.product
                                                .sellingPrice *
                                            item.quantity
                                        ).toFixed(2)}
                                    </Text>

                                    <Pressable
                                        onPress={() =>
                                            removeFromCart(
                                                item.product.productId
                                            )
                                        }
                                    >
                                        <Text
                                            style={styles.removeText}
                                        >
                                            ×
                                        </Text>
                                    </Pressable>
                                </View>
                            ))
                        )}

                        {cart.length > 0 && (
                            <View
                                style={styles.checkout}
                                onLayout={(e) => {
                                    checkoutY.current =
                                        e.nativeEvent.layout.y;
                                }}
                            >
                                <View style={styles.totalRow}>
                                    <Text
                                        style={styles.totalLabel}
                                    >
                                        TOTAL
                                    </Text>
                                    <Text
                                        style={styles.totalValue}
                                    >
                                        ${cartTotal.toFixed(2)}
                                    </Text>
                                </View>

                                <TextInput
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                    placeholder="Customer name (optional)"
                                    placeholderTextColor="#8A8F98"
                                    style={styles.input}
                                />

                                <Text style={styles.inputLabel}>
                                    Payment Method
                                </Text>

                                <View
                                    style={styles.paymentMethods}
                                >
                                    {[
                                        "Cash",
                                        "Card",
                                        "Mobile Money",
                                    ].map((method) => (
                                        <Pressable
                                            key={method}
                                            onPress={() =>
                                                setPaymentMethod(
                                                    method
                                                )
                                            }
                                            style={[
                                                styles.paymentButton,
                                                paymentMethod ===
                                                    method &&
                                                    styles.paymentButtonActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.paymentButtonText,
                                                    paymentMethod ===
                                                        method &&
                                                        styles.paymentButtonTextActive,
                                                ]}
                                            >
                                                {method}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={styles.inputLabel}>
                                    Amount Paid
                                </Text>

                                <TextInput
                                    value={amountPaid}
                                    onChangeText={setAmountPaid}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollTo(
                                                {
                                                    y: checkoutY.current,
                                                    animated: true,
                                                }
                                            );
                                        }, 150);
                                    }}
                                    placeholder="0.00"
                                    placeholderTextColor="#8A8F98"
                                    keyboardType="decimal-pad"
                                    style={styles.amountInput}
                                />

                                {parsedAmountPaid > 0 && (
                                    <View style={styles.changeRow}>
                                        <Text
                                            style={
                                                styles.changeLabel
                                            }
                                        >
                                            Change
                                        </Text>
                                        <Text
                                            style={[
                                                styles.changeValue,
                                                change < 0 &&
                                                    styles.negativeChange,
                                            ]}
                                        >
                                            ${change.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                <Pressable
                                    onPress={completeSale}
                                    disabled={processingSale}
                                    style={[
                                        styles.completeButton,
                                        processingSale &&
                                            styles.disabledButton,
                                    ]}
                                >
                                    {processingSale ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text
                                            style={
                                                styles.completeButtonText
                                            }
                                        >
                                            COMPLETE SALE
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* My Sales — always available, not tied to the cart */}
                    <Pressable
                        style={styles.salesButton}
                        onPress={() => router.push("/cashier/sales")}
                    >
                        <Text style={styles.salesButtonIcon}>
                            🧾
                        </Text>

                        <View style={styles.salesButtonContent}>
                            <Text style={styles.salesButtonTitle}>
                                My Sales
                            </Text>
                            <Text
                                style={styles.salesButtonSubtitle}
                            >
                                View your completed sales and
                                request refunds
                            </Text>
                        </View>

                        <Text style={styles.salesButtonArrow}>
                            →
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Quantity picker modal */}
            <Modal
                visible={quantityModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setQuantityModalVisible(false);
                    setSelectedProduct(null);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={
                        Platform.OS === "ios" ? "padding" : undefined
                    }
                >
                    <View style={styles.quantityModal}>
                        <Text style={styles.quantityModalTitle}>
                            Add to Cart
                        </Text>

                        {selectedProduct && (
                            <>
                                <Text
                                    style={
                                        styles.quantityProductName
                                    }
                                >
                                    {selectedProduct.productName}
                                </Text>
                                <Text
                                    style={
                                        styles.quantityProductPrice
                                    }
                                >
                                    $
                                    {Number(
                                        selectedProduct.sellingPrice
                                    ).toFixed(2)}{" "}
                                    each
                                </Text>
                                <Text style={styles.stockText}>
                                    Available:{" "}
                                    {
                                        selectedProduct.quantityInStock
                                    }
                                </Text>

                                <View
                                    style={
                                        styles.modalQuantityControls
                                    }
                                >
                                    <Pressable
                                        onPress={
                                            decreaseModalQuantity
                                        }
                                        style={
                                            styles.modalQuantityButton
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.modalQuantityButtonText
                                            }
                                        >
                                            −
                                        </Text>
                                    </Pressable>

                                    <TextInput
                                        value={quantityInput}
                                        onChangeText={(value) =>
                                            setQuantityInput(
                                                value.replace(
                                                    /[^0-9]/g,
                                                    ""
                                                )
                                            )
                                        }
                                        keyboardType="number-pad"
                                        selectTextOnFocus
                                        style={
                                            styles.modalQuantityInput
                                        }
                                    />

                                    <Pressable
                                        onPress={
                                            increaseModalQuantity
                                        }
                                        style={
                                            styles.modalQuantityButton
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.modalQuantityButtonText
                                            }
                                        >
                                            +
                                        </Text>
                                    </Pressable>
                                </View>

                                <Text
                                    style={styles.modalTotalText}
                                >
                                    Total: $
                                    {(
                                        Number(
                                            selectedProduct.sellingPrice
                                        ) *
                                        (Number(quantityInput) || 0)
                                    ).toFixed(2)}
                                </Text>

                                <View style={styles.modalActions}>
                                    <Pressable
                                        onPress={() => {
                                            setQuantityModalVisible(
                                                false
                                            );
                                            setSelectedProduct(
                                                null
                                            );
                                        }}
                                        style={styles.cancelButton}
                                    >
                                        <Text
                                            style={
                                                styles.cancelButtonText
                                            }
                                        >
                                            Cancel
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={confirmQuantity}
                                        style={
                                            styles.addToCartButton
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.addToCartButtonText
                                            }
                                        >
                                            Add to Cart
                                        </Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Task alert modal — rendered last so it overlays everything */}
            <TaskAlertModal
                task={activeTask}
                visible={activeTask !== null}
                completing={completingTask}
                onComplete={handleCompleteTask}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F7FA" },

    header: {
        backgroundColor: "#0B1F3A",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    brand: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 2,
    },
    headerTitle: { color: "#B9C7D9", fontSize: 13, marginTop: 3 },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    userName: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        textAlign: "right",
    },
    userRole: {
        color: "#9EADBF",
        fontSize: 11,
        textAlign: "right",
        marginTop: 2,
    },
    logoutButton: {
        borderWidth: 1,
        borderColor: "#52647C",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 7,
    },
    logoutText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

    scrollContent: { padding: 12, paddingBottom: 40 },

    searchInput: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 11,
        fontSize: 14,
        color: "#172033",
        borderWidth: 1,
        borderColor: "#E1E5EA",
        marginBottom: 14,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#172033",
    },
    sectionSubtitle: { color: "#7B8492", fontSize: 11, marginTop: 2 },
    refreshText: { color: "#1769E0", fontWeight: "700", fontSize: 12 },

    productRow: {
        justifyContent: "flex-start",
        gap: 8,
        marginBottom: 8,
    },
    productCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E3E7EC",
    },
    productImage: {
        width: "100%",
        height: 70,
        resizeMode: "cover",
    },
    productImagePlaceholder: {
        height: 70,
        backgroundColor: "#E8EDF4",
        alignItems: "center",
        justifyContent: "center",
    },
    productImageText: {
        fontSize: 20,
        fontWeight: "900",
        color: "#8190A5",
    },
    productCardContent: { padding: 7 },
    productName: {
        fontSize: 12,
        fontWeight: "700",
        color: "#172033",
    },
    productCode: { color: "#8A93A0", fontSize: 9, marginTop: 2 },
    productPrice: {
        color: "#1769E0",
        fontSize: 13,
        fontWeight: "900",
        marginTop: 4,
    },

    loadingContainer: { paddingVertical: 40, alignItems: "center" },
    loadingText: { marginTop: 10, color: "#7B8492" },

    emptyProducts: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 30,
        alignItems: "center",
    },
    emptyTitle: {
        fontWeight: "800",
        color: "#172033",
        fontSize: 16,
    },
    emptySubtitle: { color: "#7B8492", marginTop: 5 },

    cartSection: { marginTop: 20 },
    cartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    clearText: { color: "#D64545", fontWeight: "700" },

    emptyCart: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E3E7EC",
    },
    emptyCartTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#172033",
    },
    emptyCartText: { color: "#7B8492", marginTop: 4, fontSize: 12 },

    cartItem: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#E3E7EC",
    },
    cartItemInfo: { flex: 1 },
    cartItemName: {
        color: "#172033",
        fontWeight: "700",
        fontSize: 13,
    },
    cartItemPrice: { color: "#8A93A0", fontSize: 10, marginTop: 3 },

    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 7,
        backgroundColor: "#E9EEF5",
        alignItems: "center",
        justifyContent: "center",
    },
    quantityButtonText: {
        color: "#172033",
        fontSize: 18,
        fontWeight: "700",
    },
    quantityText: {
        minWidth: 18,
        textAlign: "center",
        fontWeight: "800",
        color: "#172033",
    },
    cartItemTotal: {
        width: 62,
        textAlign: "right",
        fontWeight: "800",
        color: "#1769E0",
        fontSize: 12,
    },
    removeText: {
        color: "#D64545",
        fontSize: 23,
        fontWeight: "700",
    },

    checkout: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#E0E5EB",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15,
        marginBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E6E9EE",
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#7B8492",
    },
    totalValue: {
        fontSize: 27,
        fontWeight: "900",
        color: "#172033",
    },

    input: {
        backgroundColor: "#F7F8FA",
        borderWidth: 1,
        borderColor: "#DEE3E9",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        color: "#172033",
        marginBottom: 14,
    },
    inputLabel: {
        color: "#596373",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 8,
    },

    paymentMethods: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    paymentButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "#DDE2E8",
        alignItems: "center",
    },
    paymentButtonActive: {
        backgroundColor: "#1769E0",
        borderColor: "#1769E0",
    },
    paymentButtonText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#596373",
    },
    paymentButtonTextActive: { color: "#FFFFFF" },

    amountInput: {
        backgroundColor: "#F7F8FA",
        borderWidth: 1,
        borderColor: "#DEE3E9",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 13,
        color: "#172033",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 12,
    },
    changeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    changeLabel: { color: "#596373", fontWeight: "700" },
    changeValue: {
        color: "#16834A",
        fontSize: 18,
        fontWeight: "900",
    },
    negativeChange: { color: "#D64545" },

    completeButton: {
        backgroundColor: "#1769E0",
        borderRadius: 11,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 52,
    },
    disabledButton: { opacity: 0.7 },
    completeButtonText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 14,
        letterSpacing: 0.5,
    },

    salesButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DBEAFE",
    },
    salesButtonIcon: { fontSize: 28, marginRight: 14 },
    salesButtonContent: { flex: 1 },
    salesButtonTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#0B1F3A",
    },
    salesButtonSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: "#64748B",
    },
    salesButtonArrow: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1769E0",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    quantityModal: {
        width: "100%",
        maxWidth: 430,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    quantityModalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0B1F3A",
        textAlign: "center",
    },
    quantityProductName: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    quantityProductPrice: {
        marginTop: 5,
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
    },
    stockText: {
        marginTop: 14,
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
        textAlign: "center",
    },
    modalQuantityControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        gap: 14,
    },
    modalQuantityButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    modalQuantityButtonText: {
        fontSize: 26,
        fontWeight: "700",
        color: "#0B1F3A",
    },
    modalQuantityInput: {
        width: 90,
        height: 52,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 14,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },
    modalTotalText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: "800",
        color: "#0B1F3A",
        textAlign: "center",
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#475569",
    },
    addToCartButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#1769E0",
        alignItems: "center",
        justifyContent: "center",
    },
    addToCartButtonText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#FFFFFF",
    },
});