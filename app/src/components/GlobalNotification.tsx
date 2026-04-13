import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/global-notification.css';

interface NotificationEventDetail {
    type: 'error' | 'success' | 'info';
    messageKey: string;
    originalMessage?: string;
}

export const GlobalNotification: React.FC = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<(NotificationEventDetail & { id: string })[]>([]);
    const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleNotification = useCallback((e: Event) => {
        const customEvent = e as CustomEvent<NotificationEventDetail>;
        const id = crypto.randomUUID();
        const newNotification = { ...customEvent.detail, id };

        setNotifications(prev => [...prev, newNotification]);

        // Auto dismiss after 5 seconds
        const timer = setTimeout(() => removeNotification(id), 5000);
        timersRef.current.add(timer);
    }, [removeNotification]);

    useEffect(() => {
        globalThis.addEventListener('app-notification', handleNotification);
        return () => {
            globalThis.removeEventListener('app-notification', handleNotification);
            // Clear all pending timers on unmount
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, [handleNotification]);

    if (notifications.length === 0) return null;

    return (
        <div className="global-notification-container">
            {notifications.map(notif => (
                <div
                    key={notif.id}
                    className={`global-notification ${notif.type}`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="notification-content">
                        <strong>{notif.type === 'error' ? t('notification.error_label') : t('notification.info_label')}:</strong>{' '}
                        {t(notif.messageKey, { defaultValue: notif.originalMessage || 'An error occurred' })}
                    </div>
                    <button
                        className="notification-close"
                        onClick={() => removeNotification(notif.id)}
                        aria-label="Close notification"
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};
