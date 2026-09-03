import { playNotificationChime, triggerNativePushNotification } from './pushNotifications';

export interface ActionLogItem {
  id: string;
  type: 
    | 'transaction_add'
    | 'transaction_update'
    | 'transaction_delete'
    | 'wallet_add'
    | 'wallet_update'
    | 'wallet_delete'
    | 'budget_add'
    | 'budget_delete'
    | 'goal_add'
    | 'goal_contribute'
    | 'goal_delete'
    | 'loan_add'
    | 'loan_payment'
    | 'loan_delete'
    | 'subscription_submit'
    | 'subscription_status'
    | 'settings_change'
    | 'data_reset';
  category: 'TRANSACTION' | 'WALLET' | 'BUDGET' | 'SAVINGS' | 'LOAN' | 'SUBSCRIPTION' | 'SETTINGS';
  title: string;
  message: string;
  details?: string;
  amount?: number;
  currency?: string;
  status: 'confirmed' | 'pending' | 'deleted' | 'updated';
  timestamp: string; // ISO string
}

export interface ActionNotificationPayload {
  type: ActionLogItem['type'];
  category: ActionLogItem['category'];
  title: string;
  message: string;
  details?: string;
  amount?: number;
  currency?: string;
  status?: ActionLogItem['status'];
}

const STORAGE_KEY = 'hishab_action_audit_logs_v1';
const MAX_LOGS = 50;

// Listeners for active UI popups and dashboard updates
type NotificationListener = (item: ActionLogItem) => void;
type LogsUpdateListener = (logs: ActionLogItem[]) => void;

const notificationListeners = new Set<NotificationListener>();
const logsUpdateListeners = new Set<LogsUpdateListener>();

export function getStoredActionLogs(): ActionLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read action audit logs:', err);
    return [];
  }
}

function saveActionLogs(logs: ActionLogItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
    logsUpdateListeners.forEach((listener) => {
      try {
        listener(logs);
      } catch (e) {
        // Safe listener error suppression
      }
    });
  } catch (err) {
    console.error('Failed to persist action logs:', err);
  }
}

/**
 * Triggers a confirmation popup notification on the current window,
 * plays a sound chime, triggers optional browser push notification,
 * and saves the event to the user's dashboard activity audit log.
 */
export function recordActionConfirmation(payload: ActionNotificationPayload): ActionLogItem {
  const newItem: ActionLogItem = {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: payload.type,
    category: payload.category,
    title: payload.title,
    message: payload.message,
    details: payload.details,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.status || 'confirmed',
    timestamp: new Date().toISOString(),
  };

  // 1. Update persistent log
  const existing = getStoredActionLogs();
  const updated = [newItem, ...existing.filter((item) => item.id !== newItem.id)].slice(0, MAX_LOGS);
  saveActionLogs(updated);

  // 2. Play sound chime
  playNotificationChime();

  // 3. Trigger native browser push notification if permitted
  triggerNativePushNotification(`✅ ${newItem.title}`, newItem.message);

  // 4. Notify active popup notification listeners
  notificationListeners.forEach((listener) => {
    try {
      listener(newItem);
    } catch (e) {
      console.warn('Listener error:', e);
    }
  });

  return newItem;
}

export function subscribeToActionNotifications(listener: NotificationListener): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function subscribeToLogsUpdates(listener: LogsUpdateListener): () => void {
  logsUpdateListeners.add(listener);
  return () => {
    logsUpdateListeners.delete(listener);
  };
}

export function clearActionLogs() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    logsUpdateListeners.forEach((listener) => listener([]));
  } catch (err) {
    console.error('Failed to clear action logs:', err);
  }
}
