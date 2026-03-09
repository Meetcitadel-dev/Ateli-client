import { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  X,
  Clock,
  Package,
  Truck,
  ShoppingCart,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Loader2,
  MapPin,
  PauseCircle,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { currentUser } from '@/data/mockData';

interface OrderCardProps {
  order: Order;
  onClick?: (order: Order) => void;
  onApprove?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; className: string }> = {
  clarification_requested: {
    label: 'Clarification',
    icon: AlertCircle,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  order_received: {
    label: 'Received',
    icon: Package,
    className: 'bg-sky-500/10 text-sky-500 border-sky-500/20'
  },
  pending_confirmation: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    className: 'bg-primary/20 text-primary border-primary/30'
  },
  material_loading: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-sky-500/10 text-sky-500 border-sky-500/20'
  },
  dispatched: {
    label: 'On the way',
    icon: Truck,
    className: 'bg-primary/20 text-primary border-primary/30'
  },
  delivered: {
    label: 'Delivered',
    icon: MapPin,
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  },
  partially_completed: {
    label: 'Partial',
    icon: RefreshCw,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  completed: {
    label: 'Payment Received',
    icon: CheckCircle2,
    className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  on_hold: {
    label: 'On Hold',
    icon: PauseCircle,
    className: 'bg-white/5 text-white/40 border-white/10'
  },
  cart: {
    label: 'Cart',
    icon: ShoppingCart,
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
};

export function OrderCard({ order, onClick, onApprove, onReject }: OrderCardProps) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const approvedCount = order.approvals.filter(a => a.action === 'approved').length;
  const totalApprovers = order.approvals.length;

  const canApprove = order.approvals.find(a => a.userId === currentUser.id)?.action === 'pending';

  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-300",
        "bg-[#111111] hover:bg-[#161616] border border-white/[0.03] hover:border-white/[0.08] rounded-2xl p-5",
        "relative active:scale-[0.99] shadow-lg"
      )}
      onClick={() => onClick?.(order)}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/90">
            {order.orderNumber}
          </span>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5",
            status.className
          )}>
            {status.icon && <status.icon className="w-3 h-3" />}
            {status.label}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>

      <p className="text-white/40 text-xs mb-6">
        Created {format(new Date(order.createdAt), 'MMM d, yyyy')}
      </p>

      {/* Order Items Preview */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex gap-2">
          {order.items.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center overflow-hidden"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-white/20" />
              )}
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center">
              <span className="text-xs font-semibold text-white/40">+{order.items.length - 2}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">
            {order.items.length} items
          </span>
          <span className="text-white/40 text-sm font-medium">
            ₹{order.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Approval Status */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
        <div className="w-6 h-6 rounded-full bg-[#d4f45d] flex items-center justify-center">
          <span className="text-[10px] font-bold text-black">
            {order.approvals[0]?.userName.split(' ').map(n => n[0]).join('') || 'NU'}
          </span>
        </div>
        <span className="text-xs text-white/40 font-medium">
          {approvedCount}/{totalApprovers} approved
        </span>
      </div>
    </div>
  );
}
