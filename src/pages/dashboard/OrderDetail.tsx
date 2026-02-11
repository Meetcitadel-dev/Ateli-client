
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { OrderDetailView } from '@/components/orders/OrderDetailView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { getOrderById, approveOrder, rejectOrder, confirmItem, payOrder } = useOrders();

    const order = getOrderById(orderId || '');

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

    return (
        <OrderDetailView
            order={order}
            onBack={() => navigate('/dashboard/orders')}
            onApprove={(id) => approveOrder(id)}
            onReject={(id) => rejectOrder(id)}
            onConfirmItem={(id, itemId) => confirmItem(id, itemId)}
            onPayment={(id, method) => payOrder(id, method)}
        />
    );
}
