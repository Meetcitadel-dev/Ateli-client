
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
    handlePartialDelivery: (orderId: string, receivedItemIds: string[]) => Promise<Order | null>;
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
            status: 'confirmed',
            isCart: false
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

        const digitalMethods = ['pay_now', 'wallet', 'zoho_online'];
        const isDigital = digitalMethods.includes(method);

        await updateOrder(orderId, {
            payment: {
                method: method as any,
                status: isDigital ? 'completed' : 'pending',
                amountPaid: isDigital ? order.totalAmount : 0,
                paidBy: isDigital ? (userId || user.id) : undefined,
                paidAt: isDigital ? new Date() : undefined
            }
        });
        toast.success(isDigital ? 'Payment recorded' : 'Payment method selected');
    }, [orders, user, updateOrder]);

    const refreshOrders = useCallback(async () => {
        await loadOrders();
    }, [loadOrders]);

    const handlePartialDelivery = useCallback(async (orderId: string, receivedItemIds: string[]): Promise<Order | null> => {
        if (!user) return null;
        const order = orders.find(o => o.id === orderId);
        if (!order) return null;

        const receivedItems = order.items.filter(item => receivedItemIds.includes(item.id));
        const unreceivedItems = order.items.filter(item => !receivedItemIds.includes(item.id));

        if (receivedItems.length === 0) {
            toast.error('Please select at least one received item');
            return null;
        }

        if (unreceivedItems.length === 0) {
            // All items received — just mark as delivered (full delivery)
            await updateOrder(orderId, {
                status: 'delivered',
                deliveryOutcome: 'completed',
                deliveryDate: new Date(),
            });
            toast.success('All items received — order marked as delivered');
            return null;
        }

        // 1) Update original order: keep only received items, mark as delivered
        const receivedTotal = receivedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const pendingItemIds = unreceivedItems.map(item => item.id);

        await updateOrder(orderId, {
            items: receivedItems,
            totalAmount: receivedTotal,
            status: 'delivered',
            deliveryOutcome: 'partially_completed',
            deliveryDate: new Date(),
            pendingItems: pendingItemIds,
            notes: (order.notes ? order.notes + '\n' : '') + `Partial delivery — ${unreceivedItems.length} item(s) moved to new order.`,
        });

        // 2) Create new order for unreceived items
        const unreceivedTotal = unreceivedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const newOrder: Order = {
            id: `ord-${Date.now()}`,
            projectId: order.projectId,
            orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            items: unreceivedItems.map(item => ({ ...item, isConfirmed: true, confirmedBy: user.id, confirmedAt: new Date() })),
            totalAmount: unreceivedTotal,
            status: 'confirmed',
            approvals: [{
                userId: user.id,
                userName: user.name,
                action: 'approved',
                timestamp: new Date(),
                comment: `Auto-created from partial delivery of #${order.orderNumber}`
            }],
            createdBy: user.id,
            createdByName: user.name,
            initiatedBy: order.initiatedBy,
            createdAt: new Date(),
            updatedAt: new Date(),
            notes: `Re-order from partial delivery of ${order.orderNumber}. Original items not received.`,
        };

        try {
            await db.saveOrder(newOrder, user.name);
            setOrders(prev => [newOrder, ...prev]);
            toast.success(`Partial delivery recorded. ${unreceivedItems.length} item(s) moved to new order ${newOrder.orderNumber}`);
            return newOrder;
        } catch (err: any) {
            console.error('Failed to create partial delivery order:', err);
            toast.error(`Failed to create new order for pending items: ${err.message}`);
            return null;
        }
    }, [orders, user, updateOrder]);

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
            refreshOrders,
            handlePartialDelivery
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

