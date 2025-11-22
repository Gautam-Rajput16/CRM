import React, { useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useUnifiedTaskNotifications } from '../hooks/useUnifiedTaskNotifications';
import { useAuth } from '../hooks/useAuth';
import { useProfiles } from '../hooks/useProfiles';

export const TaskNotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { profiles } = useProfiles(true);
  const currentUserProfile = profiles.find(p => p.id === user?.id);
  const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'team_leader';
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUnifiedTaskNotifications(user?.id, isAdmin);
  const [showDropdown, setShowDropdown] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '📋';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex flex-col items-center p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Task Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
        <span className="mt-0.5 text-[10px] font-medium text-gray-700 md:hidden">
          Tasks
        </span>
      </button>

      {/* Dropdown/Modal - Responsive */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content - Desktop: dropdown, Mobile: full-screen modal */}
          <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white md:rounded-lg shadow-xl border-0 md:border border-gray-200 z-50 md:max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base md:text-base">Task Notifications</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                  aria-label="Close notifications"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="w-full md:w-auto text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-2 py-2 px-3 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 md:p-8 text-center">
                  <Bell className="h-16 w-16 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-base md:text-sm font-medium">No task notifications</p>
                  <p className="text-gray-400 text-sm md:text-xs mt-2">
                    {isAdmin 
                      ? "You'll be notified when employees update task status"
                      : "You'll be notified when tasks are assigned to you"
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 md:p-4 active:bg-gray-100 md:hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl md:text-2xl flex-shrink-0">
                          {notification.notificationType === 'status_change' ? (
                            <span>
                              {notification.newStatus === 'completed' ? '✅' : 
                               notification.newStatus === 'in_progress' ? '🔄' :
                               notification.newStatus === 'cancelled' ? '❌' : '⏰'}
                            </span>
                          ) : (
                            getPriorityEmoji(notification.taskPriority)
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm md:text-sm line-clamp-2">
                              {notification.taskTitle}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2.5 h-2.5 md:w-2 md:h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          
                          {notification.notificationType === 'assignment' ? (
                            <p className="text-xs md:text-xs text-gray-600 mb-2">
                              Assigned by: <span className="font-medium">{notification.assignedBy}</span>
                            </p>
                          ) : (
                            <p className="text-xs md:text-xs text-gray-600 mb-2">
                              <span className="font-medium">{notification.updatedBy}</span> changed status to:{' '}
                              <span className="font-semibold text-blue-600">
                                {notification.newStatus?.replace('_', ' ').toUpperCase()}
                              </span>
                            </p>
                          )}
                          
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 text-xs">
                            <span className={`font-medium ${getPriorityColor(notification.taskPriority)}`}>
                              {notification.taskPriority.toUpperCase()} Priority
                            </span>
                            <span className="text-gray-500">
                              Due: {new Date(notification.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toRelativeTime()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Add relative time helper
declare global {
  interface Date {
    toRelativeTime(): string;
  }
}

Date.prototype.toRelativeTime = function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - this.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return this.toLocaleDateString();
};
