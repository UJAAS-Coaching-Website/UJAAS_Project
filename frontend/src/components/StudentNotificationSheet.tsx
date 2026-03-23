import { useEffect, useRef, useState } from 'react';
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
  const [expandedNotifications, setExpandedNotifications] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [desktopPosition, setDesktopPosition] = useState({ top: 64, left: 16 });
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

  useEffect(() => {
    if (!open || isMobile) return;

    const updateDesktopPosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = Math.min(416, Math.max(320, window.innerWidth - 64));
      const nextLeft = Math.min(
        window.innerWidth - panelWidth - 16,
        Math.max(16, rect.right - panelWidth)
      );

      setDesktopPosition({
        top: rect.bottom + 12,
        left: nextLeft,
      });
    };

    updateDesktopPosition();
    window.addEventListener('resize', updateDesktopPosition);
    window.addEventListener('scroll', updateDesktopPosition, true);

    return () => {
      window.removeEventListener('resize', updateDesktopPosition);
      window.removeEventListener('scroll', updateDesktopPosition, true);
    };
  }, [open, isMobile]);

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

  const toggleExpandedNotification = (id: string) => {
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <motion.button
        ref={triggerRef}
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
                initial={{ opacity: 0, y: -28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -28 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                style={{
                  width: isMobile ? '100vw' : 'min(26rem, calc(100vw - 4rem))',
                  left: isMobile ? 'auto' : `${desktopPosition.left}px`,
                  right: isMobile ? '0' : 'auto',
                  top: isMobile ? '0' : `${desktopPosition.top}px`,
                  height: isMobile ? '100dvh' : 'auto',
                  maxHeight: isMobile ? '100dvh' : 'calc(100dvh - 5rem)',
                }}
                className={`student-notification-scroll fixed z-layer-modal flex min-h-0 flex-col bg-white shadow-2xl ${
                  isMobile ? 'overflow-y-auto overscroll-contain rounded-none border-0' : 'overflow-hidden rounded-3xl'
                }`}
              >
                <div
                  style={{
                    paddingLeft: isMobile ? '2rem' : '1.75rem',
                    paddingRight: '1.25rem',
                    paddingTop: isMobile ? '1.5rem' : '1rem',
                    paddingBottom: '1rem',
                  }}
                  className={`shrink-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white ${
                    isMobile ? 'sticky top-0 z-10' : ''
                  }`}
                >
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
                  <div
                    style={
                      isMobile
                        ? undefined
                        : {
                            height: '22.5rem',
                            maxHeight: '22.5rem',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y',
                          }
                    }
                    className={`student-notification-scroll min-h-0 overflow-y-auto overscroll-contain ${
                      isMobile ? 'flex-none pb-4' : 'flex-none'
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
                            (() => {
                              const isExpanded = Boolean(expandedNotifications[notification.id]);
                              const shouldShowReadMore = notification.message.trim().length > 120;

                              return (
                          <div
                            key={notification.id}
                            role="button"
                            tabIndex={0}
                            className={`block w-full p-4 text-left transition hover:bg-gray-50 ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              if (notification.onClick) {
                                onMarkAsRead(notification.id);
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
                                onMarkAsRead(notification.id);
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

                                <p className={`mb-2 text-sm text-gray-600 ${isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>
                                  {notification.message}
                                </p>
                                {shouldShowReadMore && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleExpandedNotification(notification.id);
                                    }}
                                    className="mb-2 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                                  >
                                    {isExpanded ? 'Show less' : 'Read more'}
                                  </button>
                                )}

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
                              );
                            })()
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
