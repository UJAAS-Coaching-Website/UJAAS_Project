import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BookOpen, ClipboardList, Award, AlertCircle, CheckCheck, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from './NotificationCenter';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobile } from './ui/use-mobile';

interface StudentNotificationSheetProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export function StudentNotificationSheet({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: StudentNotificationSheetProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  const getNotificationIcon = (icon?: string) => {
    switch (icon) {
      case 'notes':
        return <BookOpen className="w-5 h-5" />;
      case 'dpp':
        return <ClipboardList className="w-5 h-5" />;
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-emerald-500';
      case 'warning':
        return 'from-orange-500 to-red-500';
      case 'announcement':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative rounded-lg p-2 transition hover:bg-gray-100"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-layer-modal bg-slate-950/35 backdrop-blur-[2px]"
              />

              <motion.aside
                initial={isMobile ? { x: '100%' } : { x: 420 }}
                animate={{ x: 0 }}
                exit={isMobile ? { x: '100%' } : { x: 420 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                style={{
                  width: isMobile ? '100vw' : 'min(26rem, calc(100vw - 1rem))',
                }}
                className="fixed right-8 md:right-0 top-16 z-layer-modal flex h-[100dvh] flex-col border-l border-white/60 bg-white shadow-2xl"
              >
                <div className="shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-5 pb-5 pt-5 text-white">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Notifications</h2>
                      <p className="mt-1 text-sm text-white/85">
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Everything is caught up'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg p-2 transition hover:bg-white/15"
                      aria-label="Close notifications"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllAsRead}
                      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col bg-white">
                  <div className="shrink-0 border-b border-gray-100 px-5 py-3">
                    <p className="text-sm font-medium text-gray-700">
                      {notifications.length === 0
                        ? 'No notifications available'
                        : 'Only the notification list scrolls here'}
                    </p>
                  </div>

                  <div
                    style={
                      isMobile
                        ? undefined
                        : {
                            height: '22.5rem',
                            maxHeight: '22.5rem',
                          }
                    }
                    className={`min-h-0 overflow-y-auto overscroll-contain ${
                      isMobile ? 'flex-1' : 'flex-none'
                    }`}
                  >
                    {notifications.length === 0 ? (
                      <div className="flex h-full min-h-56 flex-col items-center justify-center p-8 text-center">
                        <Bell className="mb-3 h-12 w-12 text-gray-300" />
                        <p className="text-gray-600">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            role="button"
                            tabIndex={0}
                            className={`block w-full p-4 text-left transition hover:bg-gray-50 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              if (notification.onClick) {
                                notification.onClick();
                                setOpen(false);
                                return;
                              }

                              onMarkAsRead(notification.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;

                              event.preventDefault();
                              if (notification.onClick) {
                                notification.onClick();
                                setOpen(false);
                                return;
                              }

                              onMarkAsRead(notification.id);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getNotificationColor(notification.type)} text-white`}>
                                {getNotificationIcon(notification.icon)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {notification.title}
                                  </h4>
                                  {!notification.read && !notification.isSticky && (
                                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                                  )}
                                </div>

                                <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-gray-500">{notification.time}</span>
                                  {!notification.isSticky && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete(notification.id);
                                      }}
                                      className="rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
