export type NotificationType =
    | 'order_created'
    | 'order_confirmed'
    | 'order_dispatched'
    | 'order_delivered'
    | 'payment_received'
    | 'approval_needed'
    | 'reminder'
    | 'message';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    orderId?: string;
    projectId?: string;
    isRead: boolean;
    createdAt: Date;
}
