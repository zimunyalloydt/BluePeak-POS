import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import NotificationBell from "../communication/NotificationBell";

export default function AdminLayout({ children }) {
    return (
        <div className="h-screen flex bg-slate-100">

            <AdminSidebar />

            <div className="flex-1 flex flex-col">

                <AdminHeader />

                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>

            </div>

        </div>
    );
}