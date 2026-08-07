import { useState } from "react";
import { createSale } from "../../services/saleService";
import useAuth from "../../hooks/useAuth";
import QuantityModal from "../../components/cashier/QuantityModal";
import CashierLayout from "../../components/cashier/CashierLayout";
import ProductGrid from "../../components/cashier/ProductGrid";
import CartPanel from "../../components/cashier/CartPanel";
import CheckoutModal from "../../components/cashier/CheckoutModal";
import TaskDrawer from "../../components/cashier/TaskDrawer";
import MessageDrawer from "../../components/cashier/MessageDrawer";
import NotificationDrawer from "../../components/cashier/NotificationDrawer";

export default function POS() {

    const [quantityOpen, setQuantityOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);
    const { user } = useAuth();
const [customerName, setCustomerName] = useState("");
    const [cart, setCart] = useState([]);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
const [messages, setMessages] = useState([]);
const [notifications, setNotifications] = useState([]);
//const [lastAddedProductId, setLastAddedProductId] = useState(null);
const [showTasks, setShowTasks] = useState(false);
const [showMessages, setShowMessages] = useState(false);
const [showNotifications, setShowNotifications] = useState(false);
const [unreadMessages, setUnreadMessages] = useState(0);

   

    function addToCart(product) {

    setSelectedProduct(product);
    setQuantityOpen(true);
   

}

function addProductWithQuantity(product, qty) {

    setCart(prev => {

        const existing = prev.find(
            x => x.productId === product.productId
        );

        if (existing) {

            return prev.map(item =>
                item.productId === product.productId
                    ? {
                          ...item,
                          qty: item.qty + qty
                      }
                    : item
            );

        }

        return [
            ...prev,
            {
                ...product,
                qty
            }
        ];

    });

}

    function increaseQty(productId) {
        setCart(prev =>
            prev.map(item =>
                item.productId === productId
                    ? { ...item, qty: item.qty + 1 }
                    : item
            )
        );
    }

    

    function updateQty(productId, qty) {

    if (isNaN(qty) || qty < 1)
        qty = 1;

    setCart(prev =>
        prev.map(item =>
            item.productId === productId
                ? { ...item, qty }
                : item
        )
    );
}

    function decreaseQty(productId) {
        setCart(prev =>
            prev
                .map(item =>
                    item.productId === productId
                        ? { ...item, qty: item.qty - 1 }
                        : item
                )
                .filter(item => item.qty > 0)
        );
    }

    function removeItem(productId) {
        setCart(prev =>
            prev.filter(item => item.productId !== productId)
        );
    }

    const total = cart.reduce(
        (sum, item) => sum + item.qty * item.sellingPrice * 1.15,
        0
    );

    return (
  <CashierLayout
    onOpenTasks={() => setShowTasks(true)}
    onOpenMessages={() => setShowMessages(true)}
    onOpenNotifications={() => setShowNotifications(true)}
    taskCount={tasks.length}
    messageCount={messages.length}
    notificationCount={notifications.length}
>

            <div className="flex h-[calc(100vh-130px)] bg-white rounded-2xl shadow overflow-hidden">

                <ProductGrid onAdd={addToCart} />

               <CartPanel
    cart={cart}
    increaseQty={increaseQty}
    decreaseQty={decreaseQty}
    updateQty={updateQty}
    removeItem={removeItem}
    customerName={customerName}
    setCustomerName={setCustomerName}
    //lastAddedProductId={lastAddedProductId}
    onCheckout={(method) => {
        if (method === "Cash") {
            setCheckoutOpen(true);
        } else {
            // Complete Card/EcoCash sale immediately
            (async () => {
                try {
                    const sale = {
                        userId: user.userId,
                        customerName: customerName,
                        paymentMethod: method,
                        amountPaid: total,
                        items: cart.map(item => ({
                            productId: item.productId,
                            quantity: item.qty
                        }))
                    };

                    const result = await createSale(sale);

                    alert(`Sale #${result.saleId} completed successfully.`);

                    setCart([]);
                    setCustomerName("");
                } catch (err) {
                    alert(
                        err.response?.data?.message ||
                        "Failed to process sale."
                    );
                }
            })();
        }
    }}
/>

            </div>

            <CheckoutModal
                open={checkoutOpen}
                total={total}
                onClose={() => setCheckoutOpen(false)}
                onComplete={async (payment) => {

                    try {

                        const sale = {
                            userId: user.userId,
                            paymentMethod: payment.method,
                            amountPaid: payment.amountPaid,
                            items: cart.map(item => ({
                                productId: item.productId,
                                quantity: item.qty
                            }))
                        };

                        console.log("Sending sale:", sale);

                        const result = await createSale(sale);

                        alert(`Sale #${result.saleId} completed successfully.`);

                        setCart([]);
                        setCustomerName("");
                        setCheckoutOpen(false);

                    }
                    catch (err) {

                        console.error(err);

                        alert(
                            err.response?.data?.message ||
                            "Failed to process sale."
                        );

                    }

                }}
            />

            <TaskDrawer
    open={showTasks}
    onClose={() => setShowTasks(false)}
   
/>

<MessageDrawer
    open={showMessages}
    onClose={() => setShowMessages(false)}
    messages={messages}
/>

<NotificationDrawer
    open={showNotifications}
    onClose={() => setShowNotifications(false)}
    notifications={notifications}
/>
<QuantityModal
    open={quantityOpen}
    product={selectedProduct}
    onCancel={() => {
        setQuantityOpen(false);
        setSelectedProduct(null);
    }}
    onConfirm={(qty) => {

        addProductWithQuantity(selectedProduct, qty);

        setQuantityOpen(false);
        setSelectedProduct(null);

    }}
/>

        </CashierLayout>
    );

}