import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export const LogoutReminder: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const lastNotificationDate = useRef<string | null>(null);

    const playBeep = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1.5); // Beep for 1.5 seconds
        } catch (error) {
            console.error('Failed to play beep:', error);
        }
    };

    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const todayDateString = now.toDateString();

            // Check if it's 5:30 PM (17:30)
            if (hours === 17 && minutes === 30) {
                // Check if we haven't shown the notification today
                if (lastNotificationDate.current !== todayDateString) {
                    setIsOpen(true);
                    playBeep();

                    // Mark as shown for today
                    lastNotificationDate.current = todayDateString;
                }
            }
        };

        // Check immediately on mount
        checkTime();

        // Check every 30 seconds
        const intervalId = setInterval(checkTime, 30000);

        return () => clearInterval(intervalId);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 relative animate-bounce-in border-l-4 border-yellow-500">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-100 p-3 rounded-full mb-4">
                        <span className="text-4xl" role="img" aria-label="clock">⏰</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">End of Day Reminder</h2>

                    <p className="text-gray-600 mb-6 text-lg">
                        It's 5:30 PM! Please remember to <span className="font-semibold text-yellow-600">log out</span> before leaving the CRM.
                    </p>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-md"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </div>
    );
};
