import { useCallback, useEffect, useState } from 'react';
import { deleteNotification as apiDeleteNotification, fetchStudentNotifications, markNotificationAsRead as apiMarkRead } from '../api/facultyReviews';
import { apiFetchChapterById } from '../api/chapters';
import { formatTimeAgo } from '../utils/time';
import type { User } from '../App';
import type { Notification } from '../components/NotificationCenter';

interface UseStudentNotificationsOptions {
  user: User | null;
  onOpenReview: () => void;
  onNavigate: (tab: 'home' | 'test-series', subTab?: string) => void;
  persistNotifications: (key: string, value: string) => void;
}

const NOTES_RETURN_CONTEXT_KEY = 'ujaasNotesReturnContext';

export function useStudentNotifications({
  user,
  onOpenReview,
  onNavigate,
  persistNotifications,
}: UseStudentNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!user || user.role !== 'student') {
      return;
    }

    try {
      const data = await fetchStudentNotifications();

      const openNotesContext = async (chapterId: string, activeContentType: 'notes' | 'dpps') => {
        if (!user?.studentDetails?.batch) {
          onNavigate('home');
          return;
        }

        try {
          const chapter = await apiFetchChapterById(chapterId);
          localStorage.setItem(NOTES_RETURN_CONTEXT_KEY, JSON.stringify({
            returnTab: 'home',
            batchLabel: user.studentDetails?.batch,
            selectedSubject: chapter.subject_name,
            chapterId: chapter.id,
            chapterName: chapter.name,
            currentView: 'chapter',
            activeContentType,
          }));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('ujaas-notes-return-context'));
          }
        } catch (error) {
          console.error('Failed to load chapter for notification:', error);
        } finally {
          onNavigate('home');
        }
      };

      const mapped: Notification[] = data.map((notification) => {
        const metadata = notification.metadata || {};
        let onClick: Notification['onClick'];

        if (metadata?.openReview) {
          onClick = onOpenReview;
        } else if (notification.type === 'test') {
          onClick = () => onNavigate('test-series');
        } else if (notification.type === 'dpp' && metadata?.chapterId) {
          onClick = () => { void openNotesContext(metadata.chapterId, 'dpps'); };
        } else if (notification.type === 'notes' && metadata?.chapterId) {
          onClick = () => { void openNotesContext(metadata.chapterId, 'notes'); };
        }

        return ({
        id: notification.id,
        type: (['info', 'success', 'warning', 'announcement'].includes(notification.type) ? notification.type : 'info') as Notification['type'],
        title: notification.title,
        message: notification.message,
        time: formatTimeAgo(notification.created_at),
        read: notification.is_read,
        isSticky: notification.is_sticky,
        metadata,
        icon: (notification.type === 'test' ? 'award' : notification.type === 'dpp' ? 'dpp' : notification.type === 'review' ? 'alert' : 'notes') as Notification['icon'],
        onClick,
      });
    });

      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [onNavigate, onOpenReview, user]);

  useEffect(() => {
    void refreshNotifications();
    const timer = setInterval(() => {
      void refreshNotifications();
    }, 60000);

    return () => clearInterval(timer);
  }, [refreshNotifications]);

  useEffect(() => {
    if (notifications.length > 0) {
      persistNotifications('ujaasNotifications', JSON.stringify(notifications));
    }
  }, [notifications, persistNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    );

    if (user?.role === 'student') {
      try {
        await apiMarkRead(id);
      } catch (error) {
        console.error('Failed to mark read:', error);
      }
    }
  }, [user]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const handleDeleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));

    if (user?.role === 'student') {
      try {
        await apiDeleteNotification(id);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  }, [user]);

  return {
    notifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDeleteNotification,
  };
}
