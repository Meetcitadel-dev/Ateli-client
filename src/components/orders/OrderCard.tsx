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
    label: 'Clarification Requested', 
    icon: AlertCircle, 
    className: 'bg-warning/10 text-warning border-warning/20' 
  },
  order_received: { 
    label: 'Order Received', 
    icon: Package, 
    className: 'bg-info/10 text-info border-info/20' 
  },
  pending_confirmation: { 
    label: 'Pending Confirmation', 
    icon: Clock, 
    className: 'bg-warning/10 text-warning border-warning/20' 
  },
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle2, 
    className: 'bg-success/10 text-success border-success/20' 
  },
  material_loading: { 
    label: 'Material Loading', 
    icon: Loader2, 
    className: 'bg-info/10 text-info border-info/20' 
  },
  dispatched: { 
    label: 'Dispatched', 
    icon: Truck, 
    className: 'bg-info/10 text-info border-info/20' 
  },
  delivered: { 
    label: 'Delivered', 
    icon: MapPin, 
    className: 'bg-success/10 text-success border-success/20' 
  },
  partially_completed: { 
    label: 'Partially Completed', 
    icon: RefreshCw, 
    className: 'bg-warning/10 text-warning border-warning/20' 
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle2, 
    className: 'bg-success/10 text-success border-success/20' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  on_hold: { 
    label: 'On Hold', 
    icon: PauseCircle, 
    className: 'bg-muted text-muted-foreground border-muted-foreground/20' 
  },
};

export function OrderCard({ order, onClick, onApprove, onReject }: OrderCardProps) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  
  const currentUserApproval = order.approvals.find(a => a.userId === currentUser.id);
  const approvedCount = order.approvals.filter(a => a.action === 'approved').length;
  const totalApprovers = order.approvals.length;
  
  const canApprove = currentUserApproval?.action === 'pending';

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg border-border/60",
        "hover:border-accent/30"
      )}
      onClick={() => onClick?.(order)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">
                {order.orderNumber}
              </span>
              <Badge variant="outline" className={cn("text-xs border", status.className)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Created {format(new Date(order.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Order Items Preview */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-2">
            {order.items.slice(0, 3).map((item, index) => (
              <div 
                key={item.id}
                className="w-12 h-12 rounded-lg border-2 border-background bg-muted overflow-hidden"
                style={{ zIndex: order.items.length - index }}
              >
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{order.items.length - 3}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {order.items.length} item{order.items.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              ₹{order.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Approval Progress */}
        {order.approvals.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {order.approvals.map((approval) => (
                  <Avatar key={approval.userId} className="w-6 h-6 border-2 border-background">
                    <AvatarFallback className={cn(
                      "text-[10px] font-medium",
                      approval.action === 'approved' && "bg-success text-success-foreground",
                      approval.action === 'rejected' && "bg-destructive text-destructive-foreground",
                      approval.action === 'pending' && "bg-muted text-muted-foreground"
                    )}>
                      {approval.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {approvedCount}/{totalApprovers} approved
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {canApprove && (
        <CardFooter className="pt-3 border-t border-border/60">
          <div className="flex gap-2 w-full" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              onClick={() => onReject?.(order.id)}
            >
              <X className="w-4 h-4 mr-1.5" />
              Reject
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => onApprove?.(order.id)}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Approve
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
