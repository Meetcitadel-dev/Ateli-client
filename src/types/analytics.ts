import { OrderStatus } from './order';

export interface UserOrderStats {
    userId: string;
    userName: string;
    totalOrders: number;
    totalValue: number;
    pendingOrders: number;
    completedOrders: number;
}

export interface ProjectAnalytics {
    projectId: string;
    totalOrders: number;
    totalValue: number;
    ordersByStatus: Record<OrderStatus, number>;
    ordersByMember: UserOrderStats[];
    deliveryStats: {
        onTime: number;
        delayed: number;
        cancelled: number;
    };
}
