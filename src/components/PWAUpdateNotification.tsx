import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <Download className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-900">Update Available</h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            A new version of the app is available. Update now to get the latest features and improvements.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-md hover:bg-blue-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-blue-400 hover:text-blue-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;
