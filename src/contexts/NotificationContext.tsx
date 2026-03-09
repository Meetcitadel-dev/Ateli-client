
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification as AppNotification } from '@/types';
import { db } from '@/services/db';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        try {
            const data = await db.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Request notification permissions
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().catch(err => console.error("Notification permission error:", err));
        }
    }, []);

    // Realtime subscription for notifications
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new;
                        setNotifications(prev => {
                            if (prev.some(n => n.id === newNotif.id)) return prev;
                            const processedNotif: AppNotification = {
                                ...newNotif,
                                isRead: newNotif.is_read,
                                orderId: newNotif.order_id,
                                projectId: newNotif.project_id,
                                createdAt: new Date(newNotif.created_at)
                            };

                            // Show browser notification if permitted and in background
                            if ("Notification" in window && Notification.permission === "granted") {
                                if (document.hidden) {
                                    new Notification(processedNotif.title, { body: processedNotif.message });
                                }
                            }
                            // Always show a toast
                            toast.info(processedNotif.title, { description: processedNotif.message });

                            return [processedNotif, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotif = payload.new;
                        setNotifications(prev => prev.map(n =>
                            n.id === updatedNotif.id
                                ? { ...n, isRead: updatedNotif.is_read }
                                : n
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        const oldId = payload.old?.id;
                        if (oldId) {
                            setNotifications(prev => prev.filter(n => n.id !== oldId));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await db.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await db.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
