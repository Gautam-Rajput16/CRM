import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TaskDB, TaskStatus } from '../types/Task';
import { toast } from 'react-hot-toast';

interface TaskStatusChange {
  taskId: string;
  taskTitle: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  updatedBy: string;
  assignedTo: string;
  assignedToName: string;
  priority: string;
}

export const useTaskStatusNotifications = (userId?: string, isAdmin: boolean = false) => {
  const taskStatusMapRef = useRef<Map<string, TaskStatus>>(new Map());
  const notificationPermission = useRef<NotificationPermission>('default');

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        notificationPermission.current = permission;
        
        if (permission === 'granted') {
          toast.success('Browser notifications enabled!');
        } else if (permission === 'denied') {
          toast.error('Browser notifications blocked. Please enable them in your browser settings.');
        }
        
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }
    return 'denied';
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((change: TaskStatusChange) => {
    if (!('Notification' in window) || notificationPermission.current !== 'granted') {
      return;
    }

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
    }[change.priority] || '📋';

    const title = `${statusEmoji} Task Status Updated`;
    const body = `${priorityEmoji} ${change.taskTitle}\n${change.assignedToName} changed status to: ${change.newStatus.replace('_', ' ').toUpperCase()}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: change.taskId,
        requireInteraction: true, // Keep notification until user interacts
        silent: false,
      });

      // Handle click - focus window and close notification
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
    }[change.priority] || '📋';

    const statusText = change.newStatus.replace('_', ' ').toUpperCase();
    
    const message = `${statusEmoji} ${priorityEmoji} Task Updated!\n${change.taskTitle}\nStatus: ${statusText}\nUpdated by: ${change.assignedToName}`;

    // Different toast styles based on status
    if (change.newStatus === 'completed') {
      toast.success(message, {
        duration: 6000,
        icon: '🎉',
        style: {
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
        },
      });
    } else if (change.newStatus === 'in_progress') {
      toast(message, {
        duration: 5000,
        icon: '🔄',
        style: {
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
        },
      });
    } else {
      toast(message, {
        duration: 5000,
        style: {
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
        },
      });
    }
  }, []);

  // Monitor task status changes
  const monitorTaskStatusChanges = useCallback(async () => {
    if (!userId || !isAdmin) return;

    try {
      // Fetch all tasks for the organization
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const tasks = data as TaskDB[];

      // Check for status changes
      tasks.forEach((task) => {
        const previousStatus = taskStatusMapRef.current.get(task.id);
        
        if (previousStatus && previousStatus !== task.status) {
          // Status changed!
          const change: TaskStatusChange = {
            taskId: task.id,
            taskTitle: task.title,
            oldStatus: previousStatus,
            newStatus: task.status,
            updatedBy: task.assigned_to,
            assignedTo: task.assigned_to,
            assignedToName: task.assigned_to_name,
            priority: task.priority,
          };

          // Show both browser and toast notifications
          showBrowserNotification(change);
          showToastNotification(change);
        }

        // Update the status map
        taskStatusMapRef.current.set(task.id, task.status);
      });
    } catch (error: any) {
      console.error('Error monitoring task status changes:', error);
    }
  }, [userId, isAdmin, showBrowserNotification, showToastNotification]);

  // Initialize notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      notificationPermission.current = Notification.permission;
      
      // Auto-request permission if not set
      if (Notification.permission === 'default' && isAdmin) {
        // Show a simple prompt
        const message = '🔔 Enable browser notifications to get real-time task status updates from your team';
        toast(message, {
          duration: 8000,
          icon: '🔔',
          style: {
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
          },
        });
        
        // Request permission after a short delay
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000);
      }
    }
  }, [isAdmin, requestNotificationPermission]);

  // Start monitoring with polling
  useEffect(() => {
    if (userId && isAdmin) {
      // Initial fetch to populate the status map
      monitorTaskStatusChanges();

      // Poll every 15 seconds for status changes
      const interval = setInterval(monitorTaskStatusChanges, 15000);

      return () => clearInterval(interval);
    }
  }, [userId, isAdmin, monitorTaskStatusChanges]);

  return {
    requestNotificationPermission,
    notificationPermission: notificationPermission.current,
    isSupported: 'Notification' in window,
  };
};
