                    import React from "react";
                    import ReactDOM from "react-dom/client";
import SignalRInitializer from "./components/SignalRInitializer";
                    import { BrowserRouter } from "react-router-dom";

                    import App from "./App";
                    import AuthProvider from "./context/AuthContext";
                    import { NotificationProvider } from "./context/NotificationContext";

                    import "./index.css";

                    ReactDOM.createRoot(document.getElementById("root")).render(
                        <BrowserRouter>
                            <NotificationProvider>
                                <SignalRInitializer />
                                <AuthProvider>
                                    <App />
                                </AuthProvider>
                            </NotificationProvider>
                        </BrowserRouter>
                    );
                          