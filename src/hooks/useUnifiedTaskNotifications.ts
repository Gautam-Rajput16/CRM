import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TaskDB, TaskStatus } from '../types/Task';
import { toast } from 'react-hot-toast';

export interface UnifiedTaskNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  taskPriority: string;
  assignedBy: string;
  dueDate: string;
  isRead: boolean;
  createdAt: Date;
  notificationType: 'assignment' | 'status_change';
  oldStatus?: string;
  newStatus?: string;
  updatedBy?: string;
}

export const useUnifiedTaskNotifications = (userId?: string, isAdmin: boolean = false) => {
  const [notifications, setNotifications] = useState<UnifiedTaskNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const taskStatusMapRef = useRef<Map<string, TaskStatus>>(new Map());
  const isInitializedRef = useRef(false);

  const showNewTaskNotification = (notification: UnifiedTaskNotification) => {
    const priorityEmoji = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[notification.taskPriority] || '📋';

    if (notification.notificationType === 'assignment') {
      const message = `${priorityEmoji} New Task: ${notification.taskTitle}\nAssigned by: ${notification.assignedBy} • Due: ${new Date(notification.dueDate).toLocaleDateString()}`;
      
      toast.success(message, {
        duration: 8000,
        icon: '📬',
        style: {
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          maxWidth: '500px',
        },
      });
    } else if (notification.notificationType === 'status_change') {
      const statusEmoji = {
        pending: '⏰',
        in_progress: '🔄',
        completed: '✅',
        cancelled: '❌',
      }[notification.newStatus || ''] || '📋';

      const message = `${statusEmoji} ${priorityEmoji} Task Status Updated!\n${notification.taskTitle}\nStatus: ${notification.newStatus?.replace('_', ' ').toUpperCase()}\nUpdated by: ${notification.updatedBy}`;

      if (notification.newStatus === 'completed') {
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
          style: {
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
          },
        });
      }
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let query = supabase
        .from('tasks')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      // For employees, only show their tasks
      if (!isAdmin) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const tasks = data as TaskDB[];
      const newNotifications: UnifiedTaskNotification[] = [];

      // Process each task
      tasks.forEach((task) => {
        // For EMPLOYEES: Only show task assignments
        if (!isAdmin && task.assigned_to === userId) {
          const assignmentNotif: UnifiedTaskNotification = {
            id: `assignment-${task.id}-${task.created_at}`,
            taskId: task.id,
            taskTitle: task.title,
            taskPriority: task.priority,
            assignedBy: task.assigned_by_name,
            dueDate: task.due_date,
            isRead: false,
            createdAt: new Date(task.created_at),
            notificationType: 'assignment',
          };
          newNotifications.push(assignmentNotif);
        }

        // For ADMINS: Show status changes
        if (isAdmin) {
          const previousStatus = taskStatusMapRef.current.get(task.id);
          const taskUpdatedAt = new Date(task.updated_at);
          const taskCreatedAt = new Date(task.created_at);
          
          // Check if task was updated after creation (status changed)
          const wasUpdated = taskUpdatedAt.getTime() > taskCreatedAt.getTime() + 1000; // 1 second buffer
          
          if (!isInitializedRef.current) {
            // First load: Show all tasks that were updated (status changed) in last 7 days
            if (wasUpdated) {
              const statusChangeNotif: UnifiedTaskNotification = {
                id: `status-${task.id}-${task.updated_at}`,
                taskId: task.id,
                taskTitle: task.title,
                taskPriority: task.priority,
                assignedBy: task.assigned_by_name,
                dueDate: task.due_date,
                isRead: false,
                createdAt: taskUpdatedAt,
                notificationType: 'status_change',
                oldStatus: 'pending', // We don't know the old status on first load
                newStatus: task.status,
                updatedBy: task.assigned_to_name,
              };
              newNotifications.push(statusChangeNotif);
            }
            // Initialize status map
            taskStatusMapRef.current.set(task.id, task.status);
          } else {
            // Subsequent polls: Detect real-time status changes
            if (previousStatus && previousStatus !== task.status) {
              // Status changed! Add to notification bell
              const statusChangeNotif: UnifiedTaskNotification = {
                id: `status-${task.id}-${task.updated_at}`,
                taskId: task.id,
                taskTitle: task.title,
                taskPriority: task.priority,
                assignedBy: task.assigned_by_name,
                dueDate: task.due_date,
                isRead: false,
                createdAt: taskUpdatedAt,
                notificationType: 'status_change',
                oldStatus: previousStatus,
                newStatus: task.status,
                updatedBy: task.assigned_to_name,
              };
              newNotifications.push(statusChangeNotif);

              // Show toast notification for new status changes
              if (taskUpdatedAt > lastChecked) {
                showNewTaskNotification(statusChangeNotif);
              }
            }
            // Update status map
            taskStatusMapRef.current.set(task.id, task.status);
          }
        }
      });

      // Mark as initialized after first fetch
      if (isAdmin && !isInitializedRef.current) {
        isInitializedRef.current = true;
      }

      // Get read notifications from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readTaskNotifications') || '[]');
      
      const notificationsWithReadStatus = newNotifications.map(notif => ({
        ...notif,
        isRead: readNotifications.includes(notif.id),
      }));

      // Show toast for new unread notifications (assignments for employees)
      if (!isAdmin) {
        const newTasks = notificationsWithReadStatus.filter(
          notif => notif.notificationType === 'assignment' && notif.createdAt > lastChecked && !notif.isRead
        );

        newTasks.forEach(task => {
          showNewTaskNotification(task);
        });
      }

      setNotifications(notificationsWithReadStatus);
      setUnreadCount(notificationsWithReadStatus.filter(n => !n.isRead).length);
      setLastChecked(new Date());
    } catch (error: any) {
      console.error('Error fetching task notifications:', error);
    }
  }, [userId, isAdmin, lastChecked]);

  const markAsRead = useCallback((notificationId: string) => {
    const readNotifications = JSON.parse(localStorage.getItem('readTaskNotifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('readTaskNotifications', JSON.stringify(readNotifications));
    }

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    const allNotificationIds = notifications.map(n => n.id);
    localStorage.setItem('readTaskNotifications', JSON.stringify(allNotificationIds));

    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  }, [notifications]);

  // Initial fetch and polling
  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Poll every 30 seconds for employees, 15 seconds for admins
      const interval = setInterval(fetchNotifications, isAdmin ? 15000 : 30000);

      return () => clearInterval(interval);
    }
  }, [userId, isAdmin, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
