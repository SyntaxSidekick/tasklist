import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { useNotificationsStore } from '@/store';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { formatRelativeTime } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, setNotifications, markAllAsRead } = useNotificationsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        setNotifications(response.data.notifications, response.data.unread_count);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={28} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner size={32} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-app border ${
                notification.is_read
                  ? 'bg-white dark:bg-gray-900 border-border dark:border-gray-800'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <h3 className="font-medium mb-1">{notification.title}</h3>
              {notification.message && (
                <p className="text-sm text-text-muted mb-2">{notification.message}</p>
              )}
              <p className="text-xs text-text-subtle">
                {formatRelativeTime(notification.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
