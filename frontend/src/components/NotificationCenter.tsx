import { useEffect, useRef, useState } from 'react';
import { Bell, X, CheckCheck, Trash2, BookOpen, ClipboardList, Award, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobile } from './ui/use-mobile';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'announcement';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: 'notes' | 'dpp' | 'award' | 'alert';
  isSticky?: boolean;
  metadata?: Record<string, any>;
  onClick?: () => void;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete 
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [desktopPanelTop, setDesktopPanelTop] = useState(72);
  const [desktopPanelRight, setDesktopPanelRight] = useState(16);
  const unreadCount = notifications.filter(n => !n.read).length;

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const syncDesktopPosition = () => {
      if (isMobile || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      setDesktopPanelTop(rect.bottom + 8);
      setDesktopPanelRight(Math.max(16, window.innerWidth - rect.right));
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    syncDesktopPosition();
    window.addEventListener('resize', syncDesktopPosition);
    window.addEventListener('scroll', syncDesktopPosition, true);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', syncDesktopPosition);
      window.removeEventListener('scroll', syncDesktopPosition, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isMobile]);

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

  const getNotificationRowStyle = (read: boolean) => ({
    background: read
      ? 'var(--theme-surface)'
      : 'color-mix(in srgb, var(--state-info-bg) 30%, var(--theme-surface) 70%)',
  });

  const toggleExpandedNotification = (id: string) => {
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Open notifications"
        className="relative rounded-lg p-2 transition"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="theme-alert-badge absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 z-layer-3000 ${isMobile ? 'bg-white' : 'bg-black/10'}`}
              />

              <motion.div
                initial={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, y: -20, scale: 0.95 }}
                animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={isMobile ? { opacity: 0, y: 24 } : { opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(event) => event.stopPropagation()}
                style={{
                  ...(isMobile
                    ? {}
                    : {
                        top: desktopPanelTop,
                        right: desktopPanelRight,
                      }),
                  background: 'var(--theme-surface-elevated)',
                  borderColor: isMobile ? undefined : 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                  backdropFilter: 'blur(18px)',
                }}
                className={`z-layer-3000 overflow-hidden ${
                  isMobile
                    ? 'fixed inset-0 flex h-[100dvh] w-full flex-col'
                    : 'fixed flex w-96 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-gray-200 shadow-2xl'
                }`}
              >
                <div className="shrink-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg p-1 transition hover:bg-white/20"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="flex items-center gap-1 text-sm text-white/90 transition hover:text-white"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div
                  className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
                    isMobile
                      ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
                      : 'max-h-[22.5rem]'
                  }`}
                  style={{ background: 'var(--theme-surface)' }}
                >
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="theme-text-muted mx-auto mb-3 h-12 w-12" />
                      <p className="theme-text-secondary">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                      {notifications.map((notification) => (
                        (() => {
                          const isExpanded = Boolean(expandedNotifications[notification.id]);
                          const shouldShowReadMore = notification.message.trim().length > 120;

                          return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="cursor-pointer p-4 transition"
                          style={getNotificationRowStyle(notification.read)}
                          onClick={() => {
                            if (notification.onClick) {
                              onMarkAsRead(notification.id);
                              notification.onClick();
                              setIsOpen(false);
                            } else {
                              onMarkAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getNotificationColor(notification.type)} text-white`}>
                              {getNotificationIcon(notification.icon)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <h4 className="theme-text-primary text-sm font-semibold">
                                  {notification.title}
                                </h4>
                                {!notification.read && !notification.isSticky && (
                                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                                )}
                              </div>
                              <p className={`theme-text-secondary mb-2 text-sm ${isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>
                                {notification.message}
                              </p>
                              {shouldShowReadMore && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandedNotification(notification.id);
                                  }}
                                  className="mb-2 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                                >
                                  {isExpanded ? 'Show less' : 'Read more'}
                                </button>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="theme-text-muted text-xs">{notification.time}</span>
                                {!notification.isSticky && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(notification.id);
                                    }}
                                    className="rounded p-1 transition"
                                    style={{ color: 'var(--theme-text-muted)' }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
