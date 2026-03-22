import { useEffect, useRef } from 'react';
import { remindersApi, notificationsApi } from '@/lib/api';
import { useNotificationsStore } from '@/store';

export function useNotifications() {
  const { setNotifications } = useNotificationsStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Load initial notifications
    loadNotifications();

    // Poll for reminders every 2 minutes
    intervalRef.current = setInterval(() => {
      checkReminders();
    }, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getAll({ unread_only: 0, limit: 50 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications, response.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const checkReminders = async () => {
    try {
      const response = await remindersApi.getUpcoming();
      if (response.success && response.data && response.data.reminders.length > 0) {
        // Show browser notifications
        if ('Notification' in window && Notification.permission === 'granted') {
          response.data.reminders.forEach((reminder: any) => {
            new Notification('Task Reminder', {
              body: reminder.task_title,
              icon: '/vite.svg',
              tag: `reminder-${reminder.id}`,
            });
          });
        }

        // Reload notifications
        loadNotifications();
      }
    } catch (error) {
      console.error('Failed to check reminders:', error);
    }
  };

  return { loadNotifications };
}

export function usePomodoroNotifications() {
  useEffect(() => {
    // Request notification permission for pomodoro
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
}
