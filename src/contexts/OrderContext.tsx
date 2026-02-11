
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Order, OrderStatus } from '@/types';
import { db } from '@/services/db';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

interface OrderContextType {
    orders: Order[];
    isLoading: boolean;
    addOrder: (order: Order) => Promise<void>;
    updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    getProjectOrders: (projectId: string) => Order[];
    getOrderById: (orderId: string) => Order | undefined;
    approveOrder: (orderId: string, userId?: string) => Promise<void>;
    rejectOrder: (orderId: string, userId?: string) => Promise<void>;
    confirmItem: (orderId: string, itemId: string, userId?: string) => Promise<void>;
    payOrder: (orderId: string, method: string, userId?: string) => Promise<void>;
    refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentProject } = useProject();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadOrders = useCallback(async () => {
        if (!currentProject) {
            setOrders([]);
            return;
        }

        setIsLoading(true);
        try {
            const projectOrders = await db.getOrders(currentProject.id);
            setOrders(projectOrders);
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentProject]);

    // Load orders when current project changes
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const addOrder = useCallback(async (order: Order) => {
        if (!user) return;

        // Ensure createdBy is set
        const orderWithCreator = {
            ...order,
            createdBy: user.id,
            createdByName: user.name
        };

        try {
            await db.saveOrder(orderWithCreator, user.name);
            setOrders(prev => [orderWithCreator, ...prev]);
            toast.success(`Order #${order.orderNumber} created`);
        } catch (err: any) {
            console.error('Failed to create order:', err);
            toast.error(`Failed to create order: ${err.message}`);
            throw err;
        }
    }, [user]);

    const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || !user) return;

        const updatedOrder = { ...order, ...updates, updatedAt: new Date() };

        try {
            await db.saveOrder(updatedOrder, user.name);
            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        } catch (err: any) {
            console.error('Failed to update order:', err);
            toast.error(`Failed to update order: ${err.message}`);
            throw err;
        }
    }, [orders, user]);

    const deleteOrder = useCallback(async (orderId: string) => {
        // For now, just remove from local state
        // Could implement soft delete in DB
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast.success('Order removed');
    }, []);

    const getProjectOrders = useCallback((projectId: string) => {
        return orders.filter(order => order.projectId === projectId);
    }, [orders]);

    const getOrderById = useCallback((orderId: string) => {
        return orders.find(o => o.id === orderId);
    }, [orders]);

    const approveOrder = useCallback(async (orderId: string, userId?: string) => {
        if (!user) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const approval = {
            userId: userId || user.id,
            userName: user.name,
            action: 'approved' as const,
            timestamp: new Date()
        };

        const updatedApprovals = [...(order.approvals || []), approval];
        await updateOrder(orderId, {
            approvals: updatedApprovals,
            status: 'confirmed'
        });
        toast.success('Order approved');
    }, [orders, user, updateOrder]);

    const rejectOrder = useCallback(async (orderId: string, userId?: string) => {
        if (!user) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const approval = {
            userId: userId || user.id,
            userName: user.name,
            action: 'rejected' as const,
            timestamp: new Date()
        };

        const updatedApprovals = [...(order.approvals || []), approval];
        await updateOrder(orderId, {
            approvals: updatedApprovals,
            status: 'cancelled'
        });
        toast.info('Order rejected');
    }, [orders, user, updateOrder]);

    const confirmItem = useCallback(async (orderId: string, itemId: string, userId?: string) => {
        if (!user) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const updatedItems = order.items.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    isConfirmed: true,
                    confirmedBy: userId || user.id,
                    confirmedAt: new Date()
                };
            }
            return item;
        });

        await updateOrder(orderId, { items: updatedItems });
    }, [orders, user, updateOrder]);

    const payOrder = useCallback(async (orderId: string, method: string, userId?: string) => {
        if (!user) return;
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        await updateOrder(orderId, {
            payment: {
                method: method as any,
                status: 'completed',
                amountPaid: order.totalAmount,
                paidBy: userId || user.id,
                paidAt: new Date()
            }
        });
        toast.success('Payment recorded');
    }, [orders, user, updateOrder]);

    const refreshOrders = useCallback(async () => {
        await loadOrders();
    }, [loadOrders]);

    return (
        <OrderContext.Provider value={{
            orders,
            isLoading,
            addOrder,
            updateOrder,
            deleteOrder,
            getProjectOrders,
            getOrderById,
            approveOrder,
            rejectOrder,
            confirmItem,
            payOrder,
            refreshOrders
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}

// Alias for backward compatibility
export const useOrders = useOrder;

