import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {

    const [overlayOpen, setOverlayOpen] = useState(false);

    const [overlayData, setOverlayData] = useState(null);

    function showNotification(data) {
        setOverlayData(data);
        setOverlayOpen(true);
    }

    function hideNotification() {
        setOverlayOpen(false);
        setOverlayData(null);
    }

    return (
        <NotificationContext.Provider
            value={{
                overlayOpen,
                overlayData,
                showNotification,
                hideNotification
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}