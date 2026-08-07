import { useEffect, useState } from "react";
import { getMySales } from "../../services/saleService";
import { getReceipt } from "../../services/saleService";
import CashierLayout from "../../components/cashier/CashierLayout";
import SalesToolbar from "../../components/cashier/SalesToolbar";
import SalesStats from "../../components/cashier/SalesStats";
import SalesTable from "../../components/cashier/SalesTable";
import ReceiptModal from "../../components/cashier/ReceiptModal";
import RefundRequestModal from "../../components/cashier/RefundRequestModal";

export default function CashierSales() {

    const [sales, setSales] = useState([]);

    const [selectedSale, setSelectedSale] = useState(null);

    const [receiptOpen, setReceiptOpen] = useState(false);

    const [refundOpen, setRefundOpen] = useState(false);

    

    useEffect(() => {

        loadSales();

    }, []);

    function openReceipt(sale) {

        setSelectedSale(sale);

        setReceiptOpen(true);

    }

    function openRefund(sale) {

        setReceiptOpen(false);

        setSelectedSale(sale);

        setRefundOpen(true);

    }

async function loadSales() {

    try {

        const data = await getMySales();

        console.log("Sales:", data);

        setSales(data);

    }

    catch (err) {

        console.error(err);

    }

}

async function openReceipt(sale) {

    try {

        const receipt = await getReceipt(sale.saleId);

        setSelectedSale(receipt);

        setReceiptOpen(true);

    } catch (err) {

        console.error(err);

        alert("Failed to load receipt.");

    }

}


    async function submitRefund(data) {

        console.log(data);

        // API call comes here

        setRefundOpen(false);

        alert("Refund request submitted.");

    }

    return (

        <CashierLayout>

            <div className="space-y-6">

                <SalesToolbar />

                <SalesStats sales={sales} />

               

            </div>

            <ReceiptModal
                open={receiptOpen}
                sale={selectedSale}
                onClose={() => setReceiptOpen(false)}
                onRefund={openRefund}
            />

            <RefundRequestModal
                open={refundOpen}
                sale={selectedSale}
                onClose={() => setRefundOpen(false)}
                onSubmit={submitRefund}
            />

            <SalesTable
    sales={sales}
    onView={openReceipt}
    onRefund={openRefund}
/>

        </CashierLayout>

    );

}