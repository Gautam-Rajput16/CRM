import { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types/Lead';

export const useNotifications = () => {
  // Push/browser notification functionality is disabled
  const [isSupported] = useState(false);
  const [permission] = useState<NotificationPermission>('denied');

  const requestPermission = useCallback(async () => {
    // Do nothing
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const showFollowUpReminder = useCallback((lead: Lead) => {
    const title = 'CRM Follow-up Reminder';
    const body = `Reminder: Follow up with ${lead.fullName} (${lead.phone}) today.`;
    
    return showNotification(title, {
      body,
      tag: `followup-${lead.id}`, // Prevents duplicate notifications for same lead
      requireInteraction: true, // Keep notification visible until user interacts
    });
  }, [showNotification]);

  const checkTodaysFollowUps = useCallback((leads: Lead[]) => {
    if (!isSupported || permission !== 'granted') {
      return [];
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const todaysFollowUps = leads.filter(lead => {
      return lead.followUpDate === today && (lead.status === 'Follow-up' || lead.status === 'Special Follow-up');
    });

    // Show notifications for today's follow-ups
    todaysFollowUps.forEach(lead => {
      showFollowUpReminder(lead);
    });

    return todaysFollowUps;
  }, [isSupported, permission, showFollowUpReminder]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showFollowUpReminder,
    checkTodaysFollowUps,
  };
};
