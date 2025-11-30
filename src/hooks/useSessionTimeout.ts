import { useEffect, useRef } from 'react';

const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const LOGIN_TIME_KEY = 'session_login_time';
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute

interface UseSessionTimeoutProps {
    isAuthenticated: boolean;
    onTimeout: () => void;
}

/**
 * Hook to manage automatic logout after 12 hours from login time
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param onTimeout - Callback function to execute when session times out
 */
export const useSessionTimeout = ({ isAuthenticated, onTimeout }: UseSessionTimeoutProps) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Only set up timeout if user is authenticated
        if (!isAuthenticated) {
            // Clear login time when user is not authenticated
            localStorage.removeItem(LOGIN_TIME_KEY);

            // Clear any existing timers
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            return;
        }

        // Get or set login time
        let loginTime = localStorage.getItem(LOGIN_TIME_KEY);

        if (!loginTime) {
            // First time login - store current timestamp
            loginTime = Date.now().toString();
            localStorage.setItem(LOGIN_TIME_KEY, loginTime);
        }

        const loginTimestamp = parseInt(loginTime, 10);
        const currentTime = Date.now();
        const elapsedTime = currentTime - loginTimestamp;
        const remainingTime = SESSION_TIMEOUT_MS - elapsedTime;

        // If session has already expired, logout immediately
        if (remainingTime <= 0) {
            onTimeout();
            return;
        }

        // Set timeout for remaining time
        timeoutRef.current = setTimeout(() => {
            onTimeout();
        }, remainingTime);

        // Set up periodic check (every minute) to handle edge cases
        // This ensures logout happens even if the main timeout fails
        checkIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - loginTimestamp;

            if (elapsed >= SESSION_TIMEOUT_MS) {
                onTimeout();
            }
        }, CHECK_INTERVAL_MS);

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [isAuthenticated, onTimeout]);

    // Listen for storage changes from other tabs
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleStorageChange = (e: StorageEvent) => {
            // If login time is removed in another tab (logout), trigger logout here too
            if (e.key === LOGIN_TIME_KEY && e.newValue === null) {
                onTimeout();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isAuthenticated, onTimeout]);
};
