import { useState, useEffect } from "react";

/**
 * Hook to detect if the Arc Identity Extension is installed.
 * It listens for the 'arc:extension:loaded' event and checks the window object.
 */
export function useExtensionDetection() {
    const [isInstalled, setIsInstalled] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkExtension = () => {
            // Check for window marker
            // @ts-ignore
            if (window.__ARC_EXTENSION_INSTALLED__) {
                setIsInstalled(true);
                setIsChecking(false);
                return;
            }

            // Check for DOM marker (Method 1)
            if (document.getElementById('arc-extension-detector')) {
                setIsInstalled(true);
                setIsChecking(false);
                return;
            }
        };

        // Check immediately
        checkExtension();

        // Listen for event (Method 2)
        const handleExtensionLoaded = () => {
            setIsInstalled(true);
            setIsChecking(false);
        };

        window.addEventListener('arc:extension:loaded', handleExtensionLoaded);

        // Polling check (in case content script loads late)
        const interval = setInterval(() => {
            checkExtension();
            if (isInstalled) clearInterval(interval);
        }, 500);

        // Stop checking after 2 seconds to avoid infinite polling
        const timeout = setTimeout(() => {
            clearInterval(interval);
            setIsChecking(false);
        }, 2000);

        return () => {
            window.removeEventListener('arc:extension:loaded', handleExtensionLoaded);
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isInstalled]);

    return { isInstalled, isChecking };
}
