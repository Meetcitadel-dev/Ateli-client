import { useState } from 'react';
import { Order, OrderStatus, OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Phone,
  User,
  CreditCard,
  Wallet,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Loader2,
  XCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onConfirmItem: (orderId: string, itemId: string) => void;
  onPayment: (orderId: string, method: string) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  clarification_requested: { label: 'Clarification Requested', icon: AlertCircle, color: 'text-warning' },
  order_received: { label: 'Order Received', icon: Package, color: 'text-info' },
  pending_confirmation: { label: 'Pending Confirmation', icon: Clock, color: 'text-warning' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-success' },
  material_loading: { label: 'Material Loading', icon: Loader2, color: 'text-info' },
  dispatched: { label: 'Dispatched', icon: Truck, color: 'text-info' },
  delivered: { label: 'Delivered', icon: MapPin, color: 'text-success' },
  partially_completed: { label: 'Partially Completed', icon: RefreshCw, color: 'text-warning' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-success' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-destructive' },
  on_hold: { label: 'On Hold', icon: PauseCircle, color: 'text-muted-foreground' },
};

const statusTimeline: OrderStatus[] = [
  'clarification_requested',
  'order_received',
  'pending_confirmation',
  'confirmed',
  'material_loading',
  'dispatched',
  'delivered',
  'completed',
];

export function OrderDetailView({ 
  order, 
  onBack, 
  onApprove, 
  onReject, 
  onConfirmItem,
  onPayment 
}: OrderDetailViewProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  
  const statusInfo = statusConfig[order.status];
  const StatusIcon = statusInfo.icon;
  
  const currentStatusIndex = statusTimeline.indexOf(order.status);
  const userApproval = order.approvals.find(a => a.userId === 'user-1');
  const canApprove = userApproval?.action === 'pending';
  const allItemsConfirmed = order.items.every(item => item.isConfirmed);
  const needsPayment = order.payment?.status !== 'completed';

  const handlePayment = (method: string) => {
    setSelectedPayment(method);
    onPayment(order.id, method);
    toast.success(`Payment initiated via ${method}`);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto scrollbar-thin">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Created on {format(order.createdAt, 'MMM d, yyyy')}
            </p>
          </div>
          <Badge className={cn('gap-1.5', statusInfo.color)}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </Badge>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Order Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {statusTimeline.slice(0, 6).map((status, index) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isActive = index <= currentStatusIndex;
                const isCurrent = status === order.status;
                
                return (
                  <div key={status} className="flex flex-col items-center flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      isCurrent && "bg-primary border-primary",
                      isActive && !isCurrent && "bg-success/20 border-success",
                      !isActive && "bg-muted border-muted-foreground/20"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        isCurrent && "text-primary-foreground",
                        isActive && !isCurrent && "text-success",
                        !isActive && "text-muted-foreground"
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs mt-2 text-center",
                      isCurrent && "font-semibold text-foreground",
                      !isCurrent && "text-muted-foreground"
                    )}>
                      {config.label.split(' ')[0]}
                    </span>
                    {index < 5 && (
                      <div className={cn(
                        "absolute h-0.5 w-full top-5 -right-1/2",
                        isActive ? "bg-success" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Driver Info (if dispatched) */}
        {order.driverInfo && (order.status === 'dispatched' || order.status === 'delivered') && (
          <Card className="border-info/50 bg-info/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-info" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Driver: {order.driverInfo.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <a href={`tel:${order.driverInfo.phone}`} className="flex items-center gap-1 text-sm text-info hover:underline">
                      <Phone className="w-3.5 h-3.5" />
                      {order.driverInfo.phone}
                    </a>
                    {order.driverInfo.vehicleNumber && (
                      <span className="text-sm text-muted-foreground">
                        Vehicle: {order.driverInfo.vehicleNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items with Item-Level Confirmation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Items</span>
              {order.status === 'delivered' && !allItemsConfirmed && (
                <Badge variant="outline" className="text-warning">
                  Please confirm received items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                {order.status === 'delivered' && (
                  <Checkbox
                    checked={item.isConfirmed}
                    onCheckedChange={() => onConfirmItem(order.id, item.id)}
                    className="mt-1"
                  />
                )}
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                    {item.isConfirmed && (
                      <Badge variant="secondary" className="text-success gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmed
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">Qty: {item.quantity}</span>
                    <span className="text-muted-foreground">@ ₹{item.unitPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">₹{item.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <span className="text-primary">₹{order.totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Team Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.approvals.map((approval) => (
              <div key={approval.userId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {approval.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{approval.userName}</p>
                  {approval.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {format(approval.timestamp, 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
                <Badge variant={
                  approval.action === 'approved' ? 'default' :
                  approval.action === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {approval.action}
                </Badge>
              </div>
            ))}

            {canApprove && (
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={() => onApprove(order.id)} 
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  onClick={() => onReject(order.id)} 
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Options */}
        {needsPayment && order.status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('pay_on_delivery')}
              >
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Pay on Delivery</p>
                  <p className="text-xs text-muted-foreground">Cash or UPI at delivery</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('pay_now')}
              >
                <CreditCard className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Pay Now</p>
                  <p className="text-xs text-muted-foreground">UPI, Card, or Net Banking</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('wallet')}
              >
                <Wallet className="w-5 h-5 text-success" />
                <div className="text-left flex-1">
                  <p className="font-medium">Pay with Wallet</p>
                  <p className="text-xs text-muted-foreground">Balance: ₹15,000</p>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('payment_link')}
              >
                <LinkIcon className="w-5 h-5 text-info" />
                <div className="text-left">
                  <p className="font-medium">Share Payment Link</p>
                  <p className="text-xs text-muted-foreground">Send link to team member</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Info (if paid) */}
        {order.payment?.status === 'completed' && (
          <Card className="border-success/50 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-success" />
                <div>
                  <p className="font-medium text-foreground">Payment Completed</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{order.payment.amountPaid.toLocaleString()} via {order.payment.method.replace('_', ' ')}
                    {order.payment.paidAt && ` on ${format(order.payment.paidAt, 'MMM d, yyyy')}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {order.notes && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimated Delivery */}
        {order.estimatedDelivery && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-info" />
                <div>
                  <p className="font-medium text-foreground">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    {format(order.estimatedDelivery, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
