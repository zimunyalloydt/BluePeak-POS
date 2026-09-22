import { useWindowDimensions } from "react-native";

export function useResponsive() {
    const { width, height } = useWindowDimensions();

    const isTablet = width >= 768;
    const isLargeTablet = width >= 1024;
    const isLandscape = width > height;

    const horizontalPadding = isLargeTablet
        ? 32
        : isTablet
            ? 24
            : 20;

    const contentMaxWidth = isLargeTablet
        ? 1200
        : isTablet
            ? 1000
            : undefined;

    return {
        width,
        height,
        isTablet,
        isLargeTablet,
        isLandscape,
        horizontalPadding,
        contentMaxWidth,
    };
}