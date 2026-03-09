
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { OrderDetailView } from '@/components/orders/OrderDetailView';
import { OrderPlacedScreen } from '@/components/orders/OrderPlacedScreen';
import { CancelSlider } from '@/components/orders/CancelSlider';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { getOrderById, approveOrder, rejectOrder, confirmItem, payOrder, updateOrder } = useOrders();
    const { user } = useAuth();

    const order = getOrderById(orderId || '');

    // Track whether this is a freshly confirmed order (for celebration + cancel slider)
    const [showCelebration, setShowCelebration] = useState(false);
    const [showCancelSlider, setShowCancelSlider] = useState(false);
    const hasShownCelebrationRef = useRef<string | null>(null);

    // Detect newly confirmed orders
    useEffect(() => {
        if (!order) return;

        // Show celebration only once per order, and only if confirmed recently (within 10 seconds)
        const isNewlyConfirmed = order.status === 'confirmed';
        const confirmedRecently = order.updatedAt && (Date.now() - new Date(order.updatedAt).getTime()) < 10000;

        if (isNewlyConfirmed && confirmedRecently && hasShownCelebrationRef.current !== order.id) {
            hasShownCelebrationRef.current = order.id;
            setShowCelebration(true);
        }
    }, [order]);

    const handleCelebrationComplete = useCallback(() => {
        setShowCelebration(false);
        setShowCancelSlider(true);
    }, []);

    const handleCancelOrder = useCallback(async () => {
        if (!order) return;
        try {
            await updateOrder(order.id, { status: 'cancelled' });
            toast.info('Order cancelled');
            setShowCancelSlider(false);
        } catch {
            toast.error('Failed to cancel order');
        }
    }, [order, updateOrder]);

    const handleCancelExpire = useCallback(() => {
        setShowCancelSlider(false);
    }, []);

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">Order not found</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/orders')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Orders
                </Button>
            </div>
        );
    }

    const handlePayment = async (id: string, method: string) => {
        if (method === 'pay_now') {
            try {
                toast.info('Opening Zoho Payments...');
                const result = await zohoService.processPayment({
                    amount: order.totalAmount,
                    orderNumber: order.orderNumber,
                    customerName: user?.name || 'Customer',
                    customerEmail: user?.email,
                    customerPhone: user?.phone,
                    projectId: order.projectId
                });

                if (result) {
                    await payOrder(id, 'zoho_online');
                    toast.success('Payment successful via Zoho!');
                }
            } catch (error: any) {
                console.error('Zoho Payment Failed:', error);
                toast.error(error.message || 'Payment failed or was canceled');
            }
        } else {
            await payOrder(id, method);
        }
    };

    return (
        <div className="relative h-full">
            {/* Celebration overlay */}
            {showCelebration && (
                <OrderPlacedScreen
                    orderNumber={order.orderNumber}
                    totalAmount={order.totalAmount}
                    onComplete={handleCelebrationComplete}
                    delayMs={3000}
                />
            )}

            {/* Main order detail view */}
            <OrderDetailView
                order={order}
                onBack={() => navigate('/dashboard/orders')}
                onApprove={(id) => approveOrder(id)}
                onReject={(id) => rejectOrder(id)}
                onConfirmItem={(id, itemId) => confirmItem(id, itemId)}
                onPayment={handlePayment}
                onUpdateStatus={(id, status) => updateOrder(id, { status })}
            />

            {/* Cancel slider – fixed at bottom */}
            {showCancelSlider && (
                <div className="fixed bottom-0 left-0 right-0 z-40">
                    <CancelSlider
                        durationMs={5000}
                        onCancel={handleCancelOrder}
                        onExpire={handleCancelExpire}
                    />
                </div>
            )}
        </div>
    );
}
