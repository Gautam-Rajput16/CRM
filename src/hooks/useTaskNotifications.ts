import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TaskDB } from '../types/Task';
import { toast } from 'react-hot-toast';

interface TaskNotification {
  id: string;
  taskTitle: string;
  taskPriority: string;
  assignedBy: string;
  dueDate: string;
  isRead: boolean;
  createdAt: Date;
  notificationType: 'assignment' | 'status_change';
  oldStatus?: string;
  newStatus?: string;
  taskId: string;
}

export const useTaskNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const showNewTaskNotification = (task: TaskNotification) => {
    const priorityEmoji = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    }[task.taskPriority] || '📋';

    const message = `${priorityEmoji} New Task: ${task.taskTitle}\nAssigned by: ${task.assignedBy} • Due: ${new Date(task.dueDate).toLocaleDateString()}`;
    
    toast.success(message, {
      duration: 8000,
      icon: '📬',
      style: {
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        maxWidth: '500px',
      },
    });
  };

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const taskNotifications: TaskNotification[] = (data || []).map((task: TaskDB) => ({
        id: `task-${task.id}-${task.created_at}`,
        taskId: task.id,
        taskTitle: task.title,
        taskPriority: task.priority,
        assignedBy: task.assigned_by_name,
        dueDate: task.due_date,
        isRead: false,
        createdAt: new Date(task.created_at),
        notificationType: 'assignment' as const,
      }));

      const readNotifications = JSON.parse(localStorage.getItem('readTaskNotifications') || '[]');
      
      const notificationsWithReadStatus = taskNotifications.map(notif => ({
        ...notif,
        isRead: readNotifications.includes(notif.id),
      }));

      const newTasks = notificationsWithReadStatus.filter(
        notif => notif.createdAt > lastChecked && !notif.isRead
      );

      newTasks.forEach(task => {
        showNewTaskNotification(task);
      });

      setNotifications(notificationsWithReadStatus);
      setUnreadCount(notificationsWithReadStatus.filter(n => !n.isRead).length);
      setLastChecked(new Date());
    } catch (error: any) {
      console.error('Error fetching task notifications:', error);
    }
  }, [userId, lastChecked]);

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
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readTaskNotifications', JSON.stringify(allIds));
    
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  }, [notifications]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  };
};
