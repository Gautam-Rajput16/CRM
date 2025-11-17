import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface TaskStatusChange {
  id: string;
  taskId: string;
  taskTitle: string;
  taskPriority: 'urgent' | 'high' | 'medium' | 'low';
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: Date;
  isRead: boolean;
}

interface TaskSnapshot {
  id: string;
  title: string;
  priority: string;
  status: string;
  assigned_to: string;
  assigned_to_name: string;
  updated_at: string;
}

export const useTaskStatusChanges = (isAdmin: boolean = false) => {
  const [statusChanges, setStatusChanges] = useState<TaskStatusChange[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const taskSnapshotsRef = useRef<Map<string, TaskSnapshot>>(new Map());
  const isInitializedRef = useRef(false);

  // Load status changes from localStorage
  const loadStoredChanges = useCallback(() => {
    try {
      const stored = localStorage.getItem('taskStatusChanges');
      if (stored) {
        const parsed = JSON.parse(stored);
        const changes = parsed.map((c: any) => ({
          ...c,
          updatedAt: new Date(c.updatedAt),
        }));
        setStatusChanges(changes);
        setUnreadCount(changes.filter((c: TaskStatusChange) => !c.isRead).length);
      }
    } catch (error) {
      console.error('Error loading stored status changes:', error);
    }
  }, []);

  // Save status changes to localStorage
  const saveStatusChanges = useCallback((changes: TaskStatusChange[]) => {
    try {
      localStorage.setItem('taskStatusChanges', JSON.stringify(changes));
    } catch (error) {
      console.error('Error saving status changes:', error);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((change: TaskStatusChange) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const statusEmoji = {
      pending: '⏰',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌',
    }[change.newStatus] || '📋';

    const priorityEmoji = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[change.taskPriority] || '📋';

    const title = `${statusEmoji} Task Status Updated`;
    const body = `${priorityEmoji} ${change.taskTitle}\n${change.updatedByName} changed status to: ${change.newStatus.replace('_', ' ').toUpperCase()}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `status-${change.taskId}-${change.updatedAt.getTime()}`,
        requireInteraction: true,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, []);

  // Show toast notification
  const showToastNotification = useCallback((change: TaskStatusChange) => {
    const statusEmoji = {
      pending: '⏰',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌',
    }[change.newStatus] || '📋';

    const priorityEmoji = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[change.taskPriority] || '📋';

    const message = `${statusEmoji} ${priorityEmoji} Task Status Updated!\n${change.taskTitle}\nStatus: ${change.newStatus.replace('_', ' ').toUpperCase()}\nUpdated by: ${change.updatedByName}`;

    if (change.newStatus === 'completed') {
      toast.success(message, {
        duration: 6000,
        icon: '🎉',
        style: {
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
        },
      });
    } else {
      toast(message, {
        duration: 5000,
        icon: statusEmoji,
        style: {
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
        },
      });
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!', {
          icon: '🔔',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, []);

  // Check for status changes
  const checkForStatusChanges = useCallback(async () => {
    if (!isAdmin) return;

    try {
      // Fetch all tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, priority, status, assigned_to, assigned_to_name, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (!tasks || tasks.length === 0) return;

      const newChanges: TaskStatusChange[] = [];

      tasks.forEach((task: TaskSnapshot) => {
        const previousSnapshot = taskSnapshotsRef.current.get(task.id);

        if (!isInitializedRef.current) {
          // First load: Just store snapshots, don't create notifications
          taskSnapshotsRef.current.set(task.id, task);
        } else if (previousSnapshot) {
          // Check if status changed
          if (previousSnapshot.status !== task.status) {
            console.log('Status change detected:', {
              taskId: task.id,
              taskTitle: task.title,
              oldStatus: previousSnapshot.status,
              newStatus: task.status,
              updatedBy: task.assigned_to_name,
            });

            const change: TaskStatusChange = {
              id: `status-${task.id}-${task.updated_at}`,
              taskId: task.id,
              taskTitle: task.title,
              taskPriority: task.priority as 'urgent' | 'high' | 'medium' | 'low',
              oldStatus: previousSnapshot.status,
              newStatus: task.status,
              updatedBy: task.assigned_to,
              updatedByName: task.assigned_to_name,
              updatedAt: new Date(task.updated_at),
              isRead: false,
            };

            newChanges.push(change);

            // Show notifications
            showBrowserNotification(change);
            showToastNotification(change);
          }

          // Update snapshot
          taskSnapshotsRef.current.set(task.id, task);
        } else {
          // New task appeared, store snapshot
          taskSnapshotsRef.current.set(task.id, task);
        }
      });

      // Mark as initialized after first fetch
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        console.log('Task status tracking initialized with', tasks.length, 'tasks');
      }

      // Add new changes to the list
      if (newChanges.length > 0) {
        console.log('Adding', newChanges.length, 'new status changes');
        setStatusChanges((prev) => {
          const updated = [...newChanges, ...prev];
          // Keep only last 50 changes
          const trimmed = updated.slice(0, 50);
          saveStatusChanges(trimmed);
          return trimmed;
        });
        setUnreadCount((prev) => prev + newChanges.length);
      }
    } catch (error) {
      console.error('Error checking for status changes:', error);
    }
  }, [isAdmin, showBrowserNotification, showToastNotification, saveStatusChanges]);

  // Mark as read
  const markAsRead = useCallback((changeId: string) => {
    setStatusChanges((prev) => {
      const updated = prev.map((change) =>
        change.id === changeId ? { ...change, isRead: true } : change
      );
      saveStatusChanges(updated);
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [saveStatusChanges]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setStatusChanges((prev) => {
      const updated = prev.map((change) => ({ ...change, isRead: true }));
      saveStatusChanges(updated);
      return updated;
    });
    setUnreadCount(0);
  }, [saveStatusChanges]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setStatusChanges([]);
    setUnreadCount(0);
    localStorage.removeItem('taskStatusChanges');
  }, []);

  // Initialize and start polling
  useEffect(() => {
    if (!isAdmin) return;

    console.log('Initializing task status change tracking...');

    // Load stored changes
    loadStoredChanges();

    // Request notification permission
    if (Notification.permission === 'default') {
      setTimeout(() => {
        toast('Enable browser notifications to get real-time task status updates', {
          duration: 8000,
          icon: '🔔',
          style: {
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
          },
        });
        setTimeout(requestNotificationPermission, 2000);
      }, 3000);
    }

    // Initial check
    checkForStatusChanges();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      console.log('Polling for status changes...');
      checkForStatusChanges();
    }, 10000);

    return () => {
      console.log('Cleaning up task status change tracking');
      clearInterval(interval);
    };
  }, [isAdmin, checkForStatusChanges, loadStoredChanges, requestNotificationPermission]);

  return {
    statusChanges,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: checkForStatusChanges,
  };
};
