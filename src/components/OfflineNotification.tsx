import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineNotification: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showNotification, setShowNotification] = React.useState(false);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowNotification(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show reconnected message briefly
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showNotification) return null;

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 rounded-lg shadow-lg p-3 z-50 transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-5 w-5 mr-2" />
        ) : (
          <WifiOff className="h-5 w-5 mr-2" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isOnline ? 'Back Online!' : 'No Internet Connection'}
          </p>
          <p className="text-xs opacity-90">
            {isOnline 
              ? 'Your connection has been restored.' 
              : 'Some features may not work properly.'
            }
          </p>
        </div>
        {!isOnline && (
          <button
            onClick={() => setShowNotification(false)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineNotification;
