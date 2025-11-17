import React, { useState } from 'react';
import { Bell, CheckCheck, X, Trash2 } from 'lucide-react';
import { useTaskStatusChanges } from '../hooks/useTaskStatusChanges';

interface TaskStatusNotificationBellProps {
  isAdmin: boolean;
}

export const TaskStatusNotificationBell: React.FC<TaskStatusNotificationBellProps> = ({ isAdmin }) => {
  const { statusChanges, unreadCount, markAsRead, markAllAsRead, clearAll } = useTaskStatusChanges(isAdmin);
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAdmin) return null;

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

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏰';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Task Status Updates"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown/Modal */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white md:rounded-lg shadow-xl border-0 md:border border-gray-200 z-50 md:max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Task Status Updates</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors md:hidden"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
              {statusChanges.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all status update notifications?')) {
                        clearAll();
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {statusChanges.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-16 w-16 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-base md:text-sm font-medium">No status updates</p>
                  <p className="text-gray-400 text-sm md:text-xs mt-2">
                    You'll be notified when employees update task status
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {statusChanges.map((change) => (
                    <div
                      key={change.id}
                      className={`p-4 active:bg-gray-100 md:hover:bg-gray-50 transition-colors cursor-pointer ${
                        !change.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!change.isRead) {
                          markAsRead(change.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl md:text-2xl flex-shrink-0">
                          {getStatusEmoji(change.newStatus)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                              {change.taskTitle}
                            </h4>
                            {!change.isRead && (
                              <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">{change.updatedByName}</span> changed status to:{' '}
                            <span className={`font-semibold px-2 py-0.5 rounded ${getStatusColor(change.newStatus)}`}>
                              {change.newStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-medium ${getPriorityColor(change.taskPriority)}`}>
                              {getPriorityEmoji(change.taskPriority)} {change.taskPriority.toUpperCase()}
                            </span>
                            <span className="text-gray-400">
                              {formatTimeAgo(change.updatedAt)}
                            </span>
                          </div>

                          {change.oldStatus && (
                            <p className="text-xs text-gray-500 mt-1">
                              Previous: {change.oldStatus.replace('_', ' ').toUpperCase()}
                            </p>
                          )}
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
