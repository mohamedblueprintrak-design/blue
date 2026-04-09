/**
 * Realtime Notifications Hook
 * Hook للإشعارات الفورية باستخدام SSE
 *
 * Uses Server-Sent Events (SSE) for real-time notifications
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Check if running in browser
const isBrowser = typeof window !== 'undefined';

// Notification types
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

// Realtime notification interface
interface RealtimeNotification {
  id: string;
  notificationType: NotificationType;
  title: string;
  message?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  timestamp?: string;
}

interface UseRealtimeOptions {
  token: string | null;
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

// Notification messages with icons
const NOTIFICATION_MESSAGES: Record<NotificationType, { title: string; icon: string }> = {
  task_assigned: { title: 'New Task', icon: '📋' },
  task_completed: { title: 'Task Completed', icon: '✅' },
  task_due_soon: { title: 'Task Due Soon', icon: '⏰' },
  invoice_created: { title: 'New Invoice', icon: '📄' },
  invoice_paid: { title: 'Invoice Paid', icon: '💰' },
  invoice_overdue: { title: 'Overdue Invoice', icon: '⚠️' },
  low_stock: { title: 'Low Stock', icon: '📦' },
  new_message: { title: 'New Message', icon: '💬' },
  deadline_approaching: { title: 'Deadline Approaching', icon: '📅' },
  project_update: { title: 'Project Update', icon: '🏗️' },
  contract_signed: { title: 'Contract Signed', icon: '📝' },
  leave_approved: { title: 'Leave Approved', icon: '✈️' },
  leave_rejected: { title: 'Leave Rejected', icon: '❌' },
  payment_received: { title: 'Payment Received', icon: '💵' },
  defect_reported: { title: 'Defect Reported', icon: '🔧' },
  system: { title: 'System Notification', icon: '🔔' },
  approval_required: { title: 'Approval Required', icon: '✋' },
};

// Show browser notification (standalone function)
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

export function useRealtime(options: UseRealtimeOptions) {
  const {
    token,
    onNotification,
    onUnreadCountChange,
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 3,
  } = options;

  const queryClient = useQueryClient();

  // Refs for tracking state without re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalDisconnectRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(false);

  // Callbacks refs to avoid dependency issues
  const onNotificationRef = useRef(onNotification);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);

  // Update refs
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

  // Handle incoming events - no dependencies (stable)
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

        case 'notification':
          const notification = data as RealtimeNotification;

          // Update notification list
          queryClientRef.current.invalidateQueries({ queryKey: ['notifications'] });

          // Call callback if provided
          if (onNotificationRef.current) {
            onNotificationRef.current(notification);
          }

          // Show browser notification if allowed
          showBrowserNotification(notification);
          break;

        case 'unread_count':
          const count = data.count;
          setState((prev) => ({ ...prev, unreadCount: count }));

          if (onUnreadCountChangeRef.current) {
            onUnreadCountChangeRef.current(count);
          }
          break;

        case 'heartbeat':
          setState((prev) => ({ ...prev, lastHeartbeat: new Date() }));
          break;

        default:
          if (data.count !== undefined) {
            setState((prev) => ({ ...prev, unreadCount: data.count }));
          }
      }
    } catch {
      // Silent fail for SSE parsing
    }
  }, []); // Empty deliberately - using refs

  // Disconnect - no dependencies
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

  // Create SSE connection - no dependencies (stable)
  const createConnection = useCallback((currentToken: string) => {
    if (!isBrowser || !currentToken || !enabledRef.current || isConnectingRef.current) {
      return;
    }

    // Reset intentional disconnect flag
    intentionalDisconnectRef.current = false;
    lastTokenRef.current = currentToken;
    isConnectingRef.current = true;

    // Close previous connection if exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create SSE connection with token in query parameter
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

      // Handle different event types
      eventSource.addEventListener('connected', handleEvent);
      eventSource.addEventListener('notification', handleEvent);
      eventSource.addEventListener('unread_count', handleEvent);
      eventSource.addEventListener('heartbeat', handleEvent);

      eventSource.onerror = () => {
        isConnectingRef.current = false;

        // Check if this was an intentional disconnect
        if (intentionalDisconnectRef.current) {
          return;
        }

        // Check if token changed or user logged out
        if (isBrowser) {
          const storedToken = localStorage.getItem('token');
          if (!storedToken || storedToken !== lastTokenRef.current) {
            eventSource.close();
            return;
          }
        }

        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'Lost connection to notification system',
        }));

        eventSource.close();

        // Only reconnect if still authenticated and have valid token
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
  }, [handleEvent]); // handleEvent is stable now

  // Create connection when token changes - no function dependencies
  useEffect(() => {
    if (!isBrowser) return;

    mountedRef.current = true;

    // Only connect if authenticated with valid token
    if (token && enabled && token !== lastTokenRef.current) {
      // Reset reconnection attempts on new connection
      reconnectAttemptsRef.current = 0;
      createConnection(token);
    } else if (!token && lastTokenRef.current) {
      // Token was cleared, disconnect
      disconnect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, enabled]); // Only primitive values

  // Token ref for reconnect
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Manual reconnect - no dependencies
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    if (tokenRef.current) {
      createConnection(tokenRef.current);
    }
  }, [createConnection, disconnect]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!isBrowser || !('Notification' in window)) {
      return false;
    }

    const BrowserNotification = window.Notification;

    if (BrowserNotification.permission === 'granted') {
      return true;
    }

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

// Simplified hook for notifications
export function useNotificationsRealtime(token: string | null) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);

  const { isConnected, unreadCount, reconnect } = useRealtime({
    token,
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
