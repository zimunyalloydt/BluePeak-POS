import { Routes, Route, Navigate } from "react-router-dom";
import CashierSales from "./pages/cashier/CashierSales";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import POS from "./pages/cashier/POS";
import Products from "./pages/admin/Products";
import ProtectedRoute from "./components/ProtectedRoute";
import Sales from "./pages/admin/Sales";
import Users from "./pages/admin/Users";
import TasksMessages from "./pages/TasksMessages";
import TaskManagement from "./pages/admin/TaskManagement";
import MyTasks from "./pages/cashier/MyTasks";
import AttentionOverlay from "./components/cashier/AttentionOverlay";

export default function App() {
    return (
        <>
            <AttentionOverlay />

            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                <Route path="/tasks" element={<TasksMessages />} />

                <Route path="/cashier/tasks" element={<MyTasks />} />

                {/* Admin Routes */}
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute roles={["Admin"]}>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/sales"
                    element={
                        <ProtectedRoute roles={["Admin"]}>
                            <Sales />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute roles={["Admin"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/products"
                    element={
                        <ProtectedRoute roles={["Admin"]}>
                            <Products />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/tasks"
                    element={
                        <ProtectedRoute roles={["Admin", "Manager"]}>
                            <TaskManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Manager */}
                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute roles={["Manager"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Cashier */}
                <Route
                    path="/cashier"
                    element={
                        <ProtectedRoute roles={["Cashier"]}>
                            <POS />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cashier/pos"
                    element={
                        <ProtectedRoute roles={["Cashier"]}>
                            <POS />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cashier/sales"
                    element={
                        <ProtectedRoute roles={["Cashier"]}>
                            <CashierSales />
                        </ProtectedRoute>
                    }
                />

                {/* Legacy */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </>
    );
}