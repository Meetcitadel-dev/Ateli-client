import { useState } from 'react';
import { Notification, NotificationType } from '@/types';
import { mockNotifications } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Package,
  MessageSquare,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPanelProps {
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  order_created: Package,
  order_confirmed: CheckCircle2,
  order_dispatched: Truck,
  order_delivered: CheckCircle2,
  payment_received: CreditCard,
  approval_needed: AlertCircle,
  reminder: Clock,
  message: MessageSquare,
};

const notificationColors: Record<NotificationType, string> = {
  order_created: 'bg-info/20 text-info',
  order_confirmed: 'bg-success/20 text-success',
  order_dispatched: 'bg-info/20 text-info',
  order_delivered: 'bg-success/20 text-success',
  payment_received: 'bg-success/20 text-success',
  approval_needed: 'bg-warning/20 text-warning',
  reminder: 'bg-warning/20 text-warning',
  message: 'bg-primary/20 text-primary',
};

export function NotificationsPanel({ onClose, onNotificationClick }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick(notification);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];
              
              return (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors flex gap-3",
                    !notification.isRead && "bg-accent/5"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "font-medium text-sm truncate",
                        !notification.isRead && "text-foreground",
                        notification.isRead && "text-muted-foreground"
                      )}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
