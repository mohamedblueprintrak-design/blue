'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useQueryClient } from '@tanstack/react-query';

// ─── Local types (adapted from BluePrint) ────────────────────────────────────

/** Notification type identifiers used across the system */
type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_due_soon'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'low_stock'
  | 'new_message'
  | 'deadline_approaching'
  | 'project_update'
  | 'contract_signed'
  | 'leave_approved'
  | 'leave_rejected'
  | 'payment_received'
  | 'defect_reported'
  | 'system'
  | 'approval_required';

/** Base notification shape expected by SSE events */
interface Notification {
  id: string;
  title: string;
  message?: string;
  notificationType: NotificationType;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface RealtimeNotification extends Notification {
  timestamp?: string;
}

type NotifType = NotificationType;

// ─── Browser check ──────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined';

/** Read the auth token from the cookie Blue uses */
function getAuthToken(): string | null {
  if (!isBrowser) return null;
  const match = document.cookie.match(/(?:^|;\s*)blueprint-auth-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── Hook options & state ────────────────────────────────────────────────────

interface UseRealtimeOptions {
  onNotification?: (notification: RealtimeNotification) => void;
  onUnreadCountChange?: (count: number) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface RealtimeState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  unreadCount: number;
  error: string | null;
}

// Notification display metadata
const NOTIFICATION_MESSAGES: Record<NotifType, { title: string; icon: string }> = {
  task_assigned: { title: 'مهمة جديدة', icon: '📋' },
  task_completed: { title: 'مهمة مكتملة', icon: '✅' },
  task_due_soon: { title: 'موعد مهمة قريب', icon: '⏰' },
  invoice_created: { title: 'فاتورة جديدة', icon: '📄' },
  invoice_paid: { title: 'فاتورة مدفوعة', icon: '💰' },
  invoice_overdue: { title: 'فاتورة متأخرة', icon: '⚠️' },
  low_stock: { title: 'مخزون منخفض', icon: '📦' },
  new_message: { title: 'رسالة جديدة', icon: '💬' },
  deadline_approaching: { title: 'موعد تسليم قريب', icon: '📅' },
  project_update: { title: 'تحديث مشروع', icon: '🏗️' },
  contract_signed: { title: 'عقد موقع', icon: '📝' },
  leave_approved: { title: 'إجازة موافق عليها', icon: '✈️' },
  leave_rejected: { title: 'إجازة مرفوضة', icon: '❌' },
  payment_received: { title: 'دفعة مستلمة', icon: '💵' },
  defect_reported: { title: 'عيب مُبلغ عنه', icon: '🔧' },
  system: { title: 'إشعار نظام', icon: '🔔' },
  approval_required: { title: 'يتطلب موافقة', icon: '✋' },
};

// ─── Browser notification helper ─────────────────────────────────────────────

function showBrowserNotification(notification: RealtimeNotification) {
  if (!isBrowser || !('Notification' in window)) return;

  const BrowserNotification = window.Notification;

  if (BrowserNotification.permission === 'granted') {
    const notifInfo = NOTIFICATION_MESSAGES[notification.notificationType] || NOTIFICATION_MESSAGES.system;

    new BrowserNotification(`${notifInfo.icon} ${notification.title}`, {
      body: notification.message || '',
      icon: '/logo.svg',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
    });
  }
}

// ─── useRealtime ─────────────────────────────────────────────────────────────

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    onNotification,
    onUnreadCountChange,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 3,
  } = options;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = getAuthToken();
  const queryClient = useQueryClient();

  // Refs for tracking state without re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(false);

  // Callback refs to avoid dependency issues
  const onNotificationRef = useRef(onNotification);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);

  useEffect(() => {
    onNotificationRef.current = onNotification;
    onUnreadCountChangeRef.current = onUnreadCountChange;
  }, [onNotification, onUnreadCountChange]);

  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastHeartbeat: null,
    unreadCount: 0,
    error: null,
  });

  // QueryClient ref to avoid dependency issues
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // Handle incoming SSE events
  const handleEvent = useCallback((event: MessageEvent) => {
    if (!isBrowser) return;

    const eventType = (event as MessageEvent & { event?: string }).event || 'message';

    try {
      const data = JSON.parse(event.data);

      switch (eventType) {
        case 'connected':
          setState((prev) => ({ ...prev, isConnected: true, error: null }));
          reconnectAttemptsRef.current = 0;
          break;

        case 'notification': {
          const notification = data as RealtimeNotification;

          // Invalidate notification query cache
          queryClientRef.current.invalidateQueries({ queryKey: ['notifications'] });

          if (onNotificationRef.current) {
            onNotificationRef.current(notification);
          }

          showBrowserNotification(notification);
          break;
        }

        case 'unread_count': {
          const count = data.count;
          setState((prev) => ({ ...prev, unreadCount: count }));

          if (onUnreadCountChangeRef.current) {
            onUnreadCountChangeRef.current(count);
          }
          break;
        }

        case 'heartbeat':
          setState((prev) => ({ ...prev, lastHeartbeat: new Date() }));
          break;

        default:
          if (data.count !== undefined) {
            setState((prev) => ({ ...prev, unreadCount: data.count }));
          }
      }
    } catch {
      // Silent fail for SSE parsing errors
    }
  }, []);

  // Disconnect helper
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    setState((prev) => ({ ...prev, isConnected: false, error: null }));
  }, []);

  // Options refs to avoid dependency issues
  const enabledRef = useRef(enabled);
  const maxReconnectAttemptsRef = useRef(maxReconnectAttempts);
  const reconnectIntervalRef = useRef(reconnectInterval);

  useEffect(() => {
    enabledRef.current = enabled;
    maxReconnectAttemptsRef.current = maxReconnectAttempts;
    reconnectIntervalRef.current = reconnectInterval;
  }, [enabled, maxReconnectAttempts, reconnectInterval]);

  // Create SSE connection
  const createConnection = useCallback(
    (currentToken: string) => {
      if (!isBrowser || !currentToken || !enabledRef.current || isConnectingRef.current) {
        return;
      }

      intentionalDisconnectRef.current = false;
      lastTokenRef.current = currentToken;
      isConnectingRef.current = true;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        // SSE with token as query parameter (cookie is also sent via withCredentials)
        const url = `/api/notifications/stream?token=${encodeURIComponent(currentToken)}`;
        const eventSource = new EventSource(url, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          isConnectingRef.current = false;
          setState((prev) => ({ ...prev, isConnected: true, error: null }));
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = handleEvent;

        eventSource.addEventListener('connected', handleEvent);
        eventSource.addEventListener('notification', handleEvent);
        eventSource.addEventListener('unread_count', handleEvent);
        eventSource.addEventListener('heartbeat', handleEvent);

        eventSource.onerror = () => {
          isConnectingRef.current = false;

          if (intentionalDisconnectRef.current) return;

          // Check if auth token changed or user logged out
          if (isBrowser) {
            const storedToken = getAuthToken();
            if (!storedToken || storedToken !== lastTokenRef.current) {
              eventSource.close();
              return;
            }
          }

          setState((prev) => ({
            ...prev,
            isConnected: false,
            error: 'Connection to notification system lost',
          }));

          eventSource.close();

          // Reconnect with exponential back-off
          if (
            reconnectAttemptsRef.current < maxReconnectAttemptsRef.current &&
            lastTokenRef.current
          ) {
            reconnectAttemptsRef.current++;
            const delay =
              reconnectIntervalRef.current *
              Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 4));

            reconnectTimeoutRef.current = setTimeout(() => {
              if (lastTokenRef.current && !intentionalDisconnectRef.current) {
                createConnection(lastTokenRef.current);
              }
            }, delay);
          } else if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
            setState((prev) => ({
              ...prev,
              error: 'Could not connect to notification system after multiple attempts',
            }));
          }
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        isConnectingRef.current = false;
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({ ...prev, error: errMsg }));
      }
    },
    [handleEvent],
  );

  // Connect / disconnect on auth state change
  useEffect(() => {
    if (!isBrowser) return;

    mountedRef.current = true;

    if (token && enabled && isAuthenticated && token !== lastTokenRef.current) {
      reconnectAttemptsRef.current = 0;
      createConnection(token);
    } else if (!token && lastTokenRef.current) {
      disconnect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled, isAuthenticated]);

  // Token ref for manual reconnect
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    const currentToken = getAuthToken();
    if (currentToken) {
      createConnection(currentToken);
    }
  }, [createConnection, disconnect]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!isBrowser || !('Notification' in window)) {
      return false;
    }

    const BrowserNotification = window.Notification;

    if (BrowserNotification.permission === 'granted') return true;

    if (BrowserNotification.permission !== 'denied') {
      const permission = await BrowserNotification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  return {
    ...state,
    reconnect,
    disconnect,
    requestNotificationPermission,
  };
}

// ─── Simplified notifications hook ───────────────────────────────────────────

export function useNotificationsRealtime() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const { isConnected, unreadCount, reconnect } = useRealtime({
    onNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
    },
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    unreadCount,
    clearNotifications,
    reconnect,
  };
}

export default useRealtime;
