import CashierHeader from "../../components/cashier/CashierHeader";
import CashierSidebar from "../../components/cashier/CashierSidebar";

import ProductGrid from "../../components/cashier/ProductGrid";
import CartPanel from "../../components/cashier/CartPanel";

export default function CashierDashboard() {
    return (
        <div className="h-screen bg-slate-100 flex flex-col">

            <CashierHeader />

            <div className="flex flex-1 overflow-hidden">

                <CashierSidebar />

               

                <ProductGrid />

                <CartPanel />

            </div>

        </div>
    );
}