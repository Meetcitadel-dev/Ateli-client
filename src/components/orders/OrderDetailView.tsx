import { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Phone,
  CreditCard,
  Wallet,
  Link as LinkIcon,
  FileText,
  ShoppingCart,
  AlertCircle,
  Loader2,
  XCircle,
  PauseCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Share2,
  Navigation,
  MessageCircle,
  Star,
  IndianRupee,
  Sparkles,
  CircleDot,
  PackageCheck,
  PackageMinus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useView } from '@/contexts/ViewContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useChat } from '@/contexts/ChatContext';
import { useOrders } from '@/contexts/OrderContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onApprove: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onConfirmItem: (orderId: string, itemId: string) => void;
  onPayment: (orderId: string, method: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

// STATUS CONFIGURATION – colors, icons, emojis, gradient
const statusConfig: Record<OrderStatus, {
  label: string;
  icon: React.ElementType;
  emoji: string;
  gradient: string;
  textColor: string;
  bgAccent: string;
}> = {
  cart: { label: 'In Cart', icon: ShoppingCart, emoji: '🛒', gradient: 'from-amber-500 to-orange-500', textColor: 'text-amber-500', bgAccent: 'bg-amber-500' },
  clarification_requested: { label: 'Clarification', icon: AlertCircle, emoji: '❓', gradient: 'from-yellow-500 to-amber-500', textColor: 'text-yellow-500', bgAccent: 'bg-yellow-500' },
  order_received: { label: 'Order Received', icon: Package, emoji: '📦', gradient: 'from-blue-500 to-indigo-500', textColor: 'text-blue-500', bgAccent: 'bg-blue-500' },
  pending_confirmation: { label: 'Pending Confirmation', icon: Clock, emoji: '⏳', gradient: 'from-yellow-500 to-amber-500', textColor: 'text-yellow-500', bgAccent: 'bg-yellow-500' },
  confirmed: { label: 'Order Confirmed', icon: CheckCircle2, emoji: '✅', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-500', bgAccent: 'bg-emerald-500' },
  material_loading: { label: 'Loading Materials', icon: Loader2, emoji: '⚙️', gradient: 'from-sky-500 to-blue-600', textColor: 'text-sky-500', bgAccent: 'bg-sky-500' },
  dispatched: { label: 'On the way', icon: Truck, emoji: '🤟', gradient: 'from-orange-500 to-red-500', textColor: 'text-orange-500', bgAccent: 'bg-orange-500' },
  delivered: { label: 'Delivered', icon: MapPin, emoji: '📍', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-500', bgAccent: 'bg-emerald-500' },
  partially_completed: { label: 'Partially Done', icon: RefreshCw, emoji: '🔄', gradient: 'from-yellow-500 to-amber-500', textColor: 'text-yellow-500', bgAccent: 'bg-yellow-500' },
  completed: { label: 'Payment Received', icon: CheckCircle2, emoji: '💰', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-500', bgAccent: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, emoji: '❌', gradient: 'from-red-500 to-rose-600', textColor: 'text-red-500', bgAccent: 'bg-red-500' },
  on_hold: { label: 'On Hold', icon: PauseCircle, emoji: '⏸️', gradient: 'from-gray-500 to-slate-600', textColor: 'text-gray-500', bgAccent: 'bg-gray-500' },
};

const timelineSteps: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'material_loading', label: 'Material Loading' },
  { status: 'dispatched', label: 'Dispatched' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'completed', label: 'Completed' },
];

const timelineOrder: OrderStatus[] = ['confirmed', 'material_loading', 'dispatched', 'delivered', 'completed'];

export function OrderDetailView({
  order,
  onBack,
  onApprove,
  onReject,
  onConfirmItem,
  onPayment,
  onUpdateStatus
}: OrderDetailViewProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const { isAdmin } = useView();
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { sendMessage } = useChat();
  const { addOrder, handlePartialDelivery } = useOrders();
  const navigate = useNavigate();

  const [isClarificationOpen, setIsClarificationOpen] = useState(false);
  const [clarificationText, setClarificationText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Partial delivery state
  const [isPartialDeliveryOpen, setIsPartialDeliveryOpen] = useState(false);
  const [selectedReceivedItems, setSelectedReceivedItems] = useState<string[]>([]);
  const [isPartialSubmitting, setIsPartialSubmitting] = useState(false);

  const toggleReceivedItem = (itemId: string) => {
    setSelectedReceivedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAllItems = () => {
    if (selectedReceivedItems.length === order.items.length) {
      setSelectedReceivedItems([]);
    } else {
      setSelectedReceivedItems(order.items.map(item => item.id));
    }
  };

  const handlePartialDeliverySubmit = async () => {
    if (selectedReceivedItems.length === 0) {
      toast.error('Please select at least one received item');
      return;
    }

    setIsPartialSubmitting(true);
    try {
      const newOrder = await handlePartialDelivery(order.id, selectedReceivedItems);
      setIsPartialDeliveryOpen(false);
      setSelectedReceivedItems([]);

      if (newOrder) {
        // Notify in chat
        await sendMessage(
          `📢 Partial Delivery Recorded for ${order.orderNumber}.\n` +
          `A new order ${newOrder.orderNumber} has been created for the remaining items.`,
          'text',
          { orderId: newOrder.id, isFromAteli: false }
        );

        // Navigate to the new order for the remaining items
        navigate(`/dashboard/orders/${newOrder.id}`);
      }
    } catch (err) {
      console.error('Failed to process partial delivery:', err);
      toast.error('Failed to process partial delivery');
    } finally {
      setIsPartialSubmitting(false);
    }
  };

  const handleReorder = async () => {
    if (!currentProject || !user) return;

    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'order_received',
      approvals: [],
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      payment: undefined,
      driverInfo: undefined,
      deliveryDate: undefined,
      estimatedDelivery: undefined,
      notes: order.notes // keep notes
    };

    try {
      await addOrder(newOrder);
      toast.success("Order duplicated! Redirecting...");
      navigate(`/dashboard/orders/${newOrder.id}`);
    } catch (err) {
      console.error("Failed to reorder:", err);
      toast.error("Failed to create new order");
    }
  };

  const projectMember = currentProject?.members.find(m => m.userId === user?.id);
  const isPayer = projectMember?.responsibilities?.includes('payer') || projectMember?.responsibilities?.includes('owner') || isAdmin;
  const isApprover = projectMember?.responsibilities?.includes('approver') || projectMember?.responsibilities?.includes('owner') || isAdmin;
  const isReceiver = projectMember?.role === 'receiver' || projectMember?.responsibilities?.includes('receiver') || projectMember?.responsibilities?.includes('owner') || isAdmin;
  const isProjectAdmin = isAdmin || projectMember?.role === 'admin' || projectMember?.role === 'owner' || projectMember?.responsibilities?.includes('owner');

  const statusInfo = statusConfig[order.status];
  const StatusIcon = statusInfo.icon;
  const userApproval = order.approvals.find(a => a.userId === user?.id);
  const canApprove = userApproval?.action === 'pending' && isApprover;
  const allItemsConfirmed = order.items.every(item => item.isConfirmed);
  const needsPayment = order.payment?.status !== 'completed';
  const currentTimelineIndex = timelineOrder.indexOf(order.status);

  const handlePayment = async (method: string) => {
    setSelectedPayment(method);
    await onPayment(order.id, method);
    if (method !== 'pay_now') {
      toast.success(`Payment initiated via ${method}`);
    }
  };

  // Status mapping for the simplified timeline
  const timelineGroups = [
    { label: 'Ordered', icon: ShoppingCart, statuses: ['order_received', 'pending_confirmation', 'clarification_requested', 'cart'] },
    { label: 'Confirmed', icon: CheckCircle2, statuses: ['confirmed'] },
    { label: 'Loading', icon: Loader2, statuses: ['material_loading'] },
    { label: 'Dispatched', icon: Truck, statuses: ['dispatched'] },
    { label: 'Delivered', icon: MapPin, statuses: ['delivered'] },
    { label: 'Payment Received', icon: CreditCard, statuses: ['completed', 'partially_completed'] },
  ];

  const getTimelineStatus = (currentStatus: OrderStatus) => {
    const currentIndex = timelineGroups.findIndex(group => group.statuses.includes(currentStatus));
    return currentIndex === -1 ? 0 : currentIndex;
  };

  const currentGroupIndex = getTimelineStatus(order.status);

  // Estimate delivery text
  const getETAText = () => {
    if (order.estimatedDelivery) {
      return format(order.estimatedDelivery, 'MMM d, h:mm a');
    }
    switch (order.status) {
      case 'confirmed': return 'Processing order';
      case 'material_loading': return 'Loading materials';
      case 'dispatched': return 'En route to site';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Order complete';
      default: return 'Estimating delivery...';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-y-auto scrollbar-thin">
      {/* ═══════════════════════════════════════════════════ */}
      {/* STICKY HEADER                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-sm tracking-tight">{order.orderNumber}</span>
          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mt-0.5">
            {format(order.createdAt, 'MMM d, yyyy')}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all active:rotate-180"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Dialog open={isClarificationOpen} onOpenChange={setIsClarificationOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/5 text-white rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic tracking-tight">Need Clarification?</DialogTitle>
            <DialogDescription className="text-white/40 text-xs font-bold uppercase tracking-widest pt-2">
              Explain what information is missing or needs to be changed for Order {order.orderNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea
              placeholder="E.g. The quantity for item X should be 10 instead of 5..."
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              className="min-h-[120px] bg-white/[0.02] border-white/10 rounded-2xl focus:border-primary/40 focus:ring-primary/20 placeholder:text-white/10 text-sm font-medium resize-none shadow-inner"
            />
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsClarificationOpen(false)}
              className="rounded-xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!clarificationText.trim()) {
                  toast.error("Please enter your clarification message");
                  return;
                }

                setIsSubmitting(true);
                try {
                  // Update order status
                  onUpdateStatus(order.id, 'clarification_requested');

                  // Send chat message
                  await sendMessage(
                    `Clarification Request for ${order.orderNumber}:\n\n${clarificationText}`,
                    'text',
                    { orderId: order.id }
                  );

                  toast.success("Clarification request sent to chat");
                  setIsClarificationOpen(false);
                  setClarificationText('');
                } catch (err) {
                  console.error("Failed to raise clarification:", err);
                  toast.error("Something went wrong. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="bg-primary text-black hover:bg-white rounded-xl px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════ */}
      {/* HERO SECTION - MODERN & CLEAN                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="px-5 pt-8 pb-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "relative w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-500",
            `bg-gradient-to-br ${statusInfo.gradient} shadow-primary/20`
          )}>
            <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] backdrop-blur-sm m-1 opacity-50" />
            <StatusIcon className="w-10 h-10 text-white relative z-10" />
            {/* Pulsing ring for active states */}
            {['dispatched', 'material_loading', 'pending_confirmation'].includes(order.status) && (
              <div className="absolute -inset-2 rounded-[3.2rem] border-2 border-white/20 animate-pulse-ring opacity-50" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              {statusInfo.label} {statusInfo.emoji}
            </h1>
            <p className="text-white/50 text-sm font-medium">
              {order.status === 'delivered' ? 'Your order has been delivered safely' : `Expected delivery: ${getETAText()}`}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* HORIZONTAL PROGRESS BAR                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="mt-8 md:mt-12 max-w-2xl mx-auto px-2">
          {/* Desktop Horizontal Timeline */}
          <div className="hidden md:flex relative justify-between">
            {/* Background line */}
            <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-white/5" />

            {/* Progress line */}
            <div
              className="absolute top-[18px] left-0 h-[3px] bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(204,240,67,0.4)]"
              style={{ width: `${(currentGroupIndex / (timelineGroups.length - 1)) * 100}%` }}
            />

            {timelineGroups.map((group, index) => {
              const isPaymentStage = index === 5;
              const isStatusActive = index <= currentGroupIndex;
              const isPaymentCompleted = order.payment?.status === 'completed';

              const isActive = isStatusActive || (isPaymentStage && isPaymentCompleted);
              const isCurrent = index === currentGroupIndex;
              const GroupIcon = group.icon;

              return (
                <div key={group.label} className="relative flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 z-10",
                    isActive ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-[#111] text-white/20 border border-white/5",
                    isCurrent && "scale-125 ring-8 ring-primary/10",
                    isPaymentStage && isPaymentCompleted && !isStatusActive && "animate-pulse"
                  )}>
                    <GroupIcon className={cn("w-4.5 h-4.5", isCurrent && index === 2 && "animate-spin")} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-tight mt-3 text-center px-1",
                    isActive ? "text-white opacity-100" : "text-white/10"
                  )}>
                    {group.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="md:hidden space-y-4 px-4">
            {timelineGroups.map((group, index) => {
              const isPaymentStage = index === 5;
              const isStatusActive = index <= currentGroupIndex;
              const isPaymentCompleted = order.payment?.status === 'completed';
              const isActive = isStatusActive || (isPaymentStage && isPaymentCompleted);
              const isCurrent = index === currentGroupIndex;
              const GroupIcon = group.icon;

              return (
                <div key={group.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10",
                      isActive ? "bg-primary text-black" : "bg-[#111] text-white/20 border border-white/5",
                      isCurrent && "ring-4 ring-primary/20"
                    )}>
                      <GroupIcon className={cn("w-4 h-4", isCurrent && index === 2 && "animate-spin")} />
                    </div>
                    {index < timelineGroups.length - 1 && (
                      <div className={cn(
                        "w-0.5 h-6 mt-1",
                        index < currentGroupIndex ? "bg-primary" : "bg-white/5"
                      )} />
                    )}
                  </div>
                  <div className="flex flex-col mb-1">
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      isActive ? "text-white" : "text-white/20"
                    )}>
                      {group.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-primary font-bold animate-pulse">Current Stage</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* CONTENT AREA                                       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="px-5 pb-20 space-y-6">

        {/* DRIVER INFO (If applicable) */}
        {order.driverInfo && (order.status === 'dispatched' || order.status === 'material_loading') && (
          <div className="p-5 rounded-3xl bg-secondary/50 border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-2 border-primary/20 p-1 bg-black">
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                    {order.driverInfo.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-emerald-500 w-5 h-5 rounded-full border-4 border-black flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-white leading-none">{order.driverInfo.name}</p>
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1.5">
                      {order.driverInfo.vehicleNumber || 'Standard delivery'}
                    </p>
                  </div>
                  <div className="px-2 py-1 rounded bg-amber-500/10 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[10px] font-black text-amber-600">4.9</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 bg-primary text-black font-bold h-10 rounded-xl gap-2" asChild>
                    <a href={`tel:${order.driverInfo.phone}`}>
                      <Phone className="w-4 h-4" />
                      Contact Driver
                    </a>
                  </Button>
                  <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-white/10 hover:bg-white/5">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ORDER SUMMARY CARD */}
        <div className="rounded-3xl bg-secondary/30 border border-white/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-5"
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-lg leading-none">₹{order.totalAmount.toLocaleString()}</p>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1.5">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-transform",
              isItemsExpanded && "rotate-180"
            )}>
              <ChevronDown className="w-5 h-5 text-white/20" />
            </div>
          </button>

          {isItemsExpanded && (
            <div className="p-5 pt-0 space-y-4 animate-in slide-in-from-top-2">
              <Separator className="bg-white/5" />
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <Package className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                      {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-bold">₹{item.totalPrice.toLocaleString()}</p>
                    {item.isConfirmed && (
                      <span className="text-[10px] text-primary font-black tracking-widest uppercase">Verified</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-4 flex items-center justify-between">
                <span className="text-white/40 text-xs font-black uppercase tracking-widest">Total Amount</span>
                <span className="text-primary text-xl font-black">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* RECEIVER ACTIONS — Full or Partial Delivery */}
        {order.status === 'dispatched' && isReceiver && (
          <div className="space-y-3">
            <Button
              className="w-full h-16 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-primary/20 gap-3"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
            >
              <PackageCheck className="w-6 h-6" />
              Received Full Order
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/40 font-black uppercase tracking-widest text-xs rounded-2xl gap-3 transition-all active:scale-[0.98]"
              onClick={() => {
                setSelectedReceivedItems([]);
                setIsPartialDeliveryOpen(true);
              }}
            >
              <PackageMinus className="w-5 h-5" />
              Partial Delivery
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* PARTIAL DELIVERY DIALOG                             */}
        {/* ═══════════════════════════════════════════════════ */}
        <Dialog open={isPartialDeliveryOpen} onOpenChange={setIsPartialDeliveryOpen}>
          <DialogContent className="bg-[#0a0a0a] border-white/5 text-white rounded-[2rem] sm:max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-black italic tracking-tight flex items-center gap-2">
                <PackageMinus className="w-6 h-6 text-amber-400" />
                Partial Delivery
              </DialogTitle>
              <DialogDescription className="text-white/40 text-xs font-bold uppercase tracking-widest pt-2">
                Select only the items you have received. Unreceived items will be moved to a new order.
              </DialogDescription>
            </DialogHeader>

            {/* Select All toggle */}
            <div className="flex items-center justify-between px-1 pt-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                {selectedReceivedItems.length} of {order.items.length} selected
              </span>
              <button
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                onClick={handleSelectAllItems}
              >
                {selectedReceivedItems.length === order.items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 scrollbar-thin">
              {order.items.map((item) => {
                const isSelected = selectedReceivedItems.includes(item.id);
                return (
                  <button
                    key={item.id}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left group",
                      isSelected
                        ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                    onClick={() => toggleReceivedItem(item.id)}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 border-2",
                      isSelected
                        ? "bg-primary border-primary text-black"
                        : "bg-white/5 border-white/10 text-transparent group-hover:border-white/20"
                    )}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>

                    {/* Item Image */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <Package className="w-5 h-5 text-white/20" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-semibold truncate transition-colors",
                        isSelected ? "text-white" : "text-white/60"
                      )}>{item.name}</p>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                        {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* Item Total */}
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-bold transition-colors",
                        isSelected ? "text-primary" : "text-white/40"
                      )}>₹{item.totalPrice.toLocaleString()}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            {selectedReceivedItems.length > 0 && selectedReceivedItems.length < order.items.length && (
              <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Received</p>
                    <p className="text-white text-sm font-bold">
                      {selectedReceivedItems.length} item{selectedReceivedItems.length > 1 ? 's' : ''} — ₹{order.items
                        .filter(i => selectedReceivedItems.includes(i.id))
                        .reduce((s, i) => s + i.totalPrice, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">New Order</p>
                    <p className="text-amber-400 text-sm font-bold">
                      {order.items.length - selectedReceivedItems.length} item{(order.items.length - selectedReceivedItems.length) > 1 ? 's' : ''} — ₹{order.items
                        .filter(i => !selectedReceivedItems.includes(i.id))
                        .reduce((s, i) => s + i.totalPrice, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-3 sm:gap-0 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsPartialDeliveryOpen(false)}
                className="rounded-xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePartialDeliverySubmit}
                disabled={isPartialSubmitting || selectedReceivedItems.length === 0}
                className={cn(
                  "rounded-xl px-8 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95",
                  selectedReceivedItems.length === order.items.length
                    ? "bg-primary text-black hover:bg-white shadow-primary/10"
                    : "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/10"
                )}
              >
                {isPartialSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : selectedReceivedItems.length === order.items.length ? (
                  'Confirm Full Delivery'
                ) : (
                  `Confirm ${selectedReceivedItems.length} Received`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADMIN ACTIONS: MARK AS PROCESSED / PAYMENT RECEIVED */}
        {order.status === 'delivered' && isProjectAdmin && (
          <Button
            className="w-full h-16 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-primary/20 gap-3"
            onClick={() => onUpdateStatus(order.id, 'completed')}
          >
            <CheckCircle2 className="w-6 h-6" />
            {order.payment?.status === 'completed' ? 'Finish & Archive Order' : 'Mark Payment as Received'}
          </Button>
        )}

        {/* ADMIN ACTIONS: PROGRESS ORDER TO LOADING */}
        {order.status === 'confirmed' && isProjectAdmin && (
          <Button
            className="w-full h-16 bg-sky-500 text-white hover:bg-sky-600 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-sky-500/20 gap-3"
            onClick={() => onUpdateStatus(order.id, 'material_loading')}
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            Start Processing
          </Button>
        )}

        {/* ADMIN OVERRIDE: CONFIRM & PROCESS (If stuck in pending or new) */}
        {(order.status === 'pending_confirmation' || order.status === 'order_received') && isProjectAdmin && (
          <Button
            className="w-full h-16 bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-emerald-500/20 gap-3"
            onClick={() => onUpdateStatus(order.id, 'confirmed')}
          >
            <CheckCircle2 className="w-6 h-6" />
            Confirm & Process Order
          </Button>
        )}

        {/* ADMIN ACTIONS: PROGRESS ORDER TO DISPATCHED */}
        {order.status === 'material_loading' && isProjectAdmin && (
          <Button
            className="w-full h-16 bg-orange-500 text-white hover:bg-orange-600 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-orange-500/20 gap-3"
            onClick={() => onUpdateStatus(order.id, 'dispatched')}
          >
            <Truck className="w-6 h-6" />
            Dispatch Order
          </Button>
        )}

        {/* CLARIFICATION ACTION */}
        {['pending_confirmation', 'confirmed', 'order_received'].includes(order.status) && (
          <Button
            variant="outline"
            className="w-full h-14 border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs rounded-2xl gap-2 transition-all active:scale-[0.98]"
            onClick={() => setIsClarificationOpen(true)}
          >
            <AlertCircle className="w-5 h-5" />
            Raise Clarification
          </Button>
        )}

        {/* ADMIN RESOLUTION */}
        {order.status === 'clarification_requested' && isProjectAdmin && (
          <Button
            className="w-full h-16 bg-primary text-black hover:bg-white font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl shadow-primary/20 gap-3"
            onClick={() => onUpdateStatus(order.id, 'confirmed')}
          >
            <CheckCircle2 className="w-6 h-6" />
            Resolve & Confirm Order
          </Button>
        )}

        {/* RE-ORDER FOR CANCELLED */}
        {order.status === 'cancelled' && (
          <Button
            className="w-full h-16 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-sm rounded-3xl shadow-2xl gap-3"
            onClick={handleReorder}
          >
            <RefreshCw className="w-6 h-6" />
            Re-order Items
          </Button>
        )}

        {/* TEAM APPROVALS */}
        {order.approvals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                Team Approvals
              </h3>
              <Badge variant="outline" className="border-white/10 text-white/40 text-[9px] font-black uppercase">
                {order.approvals.filter(a => a.action === 'approved').length}/{order.approvals.length} Verified
              </Badge>
            </div>
            <div className="space-y-2">
              {order.approvals.map((approval) => (
                <div key={approval.userId} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarFallback className={cn(
                      "text-[10px] font-black",
                      approval.action === 'approved' ? "bg-primary text-black" : "bg-white/5 text-white/40"
                    )}>
                      {approval.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{approval.userName}</p>
                    {approval.timestamp && (
                      <p className="text-[10px] text-white/40 font-medium">
                        {format(approval.timestamp, 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    approval.action === 'approved' ? "border-primary/20 bg-primary/10 text-primary" :
                      approval.action === 'rejected' ? "border-red-500/20 bg-red-500/10 text-red-500" :
                        "border-white/10 bg-white/5 text-white/40"
                  )}>
                    {approval.action}
                  </div>
                </div>
              ))}
            </div>

            {canApprove && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => onApprove(order.id)}
                  className="flex-1 h-14 bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-wider text-xs rounded-2xl gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve Order
                </Button>
                <Button
                  onClick={() => onReject(order.id)}
                  variant="outline"
                  className="flex-1 h-14 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-wider text-xs rounded-2xl gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}

        {/* PAYMENT OPTIONS */}
        {needsPayment && order.status !== 'cancelled' && isPayer && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">
              Payment Options
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'pay_now', label: 'Pay Now', sub: 'UPI / Cards', icon: CreditCard, color: 'primary' },
                { id: 'pay_on_delivery', label: 'On Delivery', sub: 'Cash / Scan', icon: Truck, color: 'amber-500' },
                { id: 'wallet', label: 'Wallet', sub: `₹${user?.walletBalance?.toLocaleString() || '0'}`, icon: Wallet, color: 'emerald-500' },
                { id: 'payment_link', label: 'Pay Link', sub: 'Share Link', icon: LinkIcon, color: 'sky-500' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className="flex flex-col items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group active:scale-[0.98]"
                  onClick={() => handlePayment(opt.id)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
                    opt.id === 'pay_now' ? "bg-primary text-black" : "bg-white/5 text-white/40 group-hover:text-white"
                  )}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-white font-bold text-sm block">{opt.label}</span>
                    <span className="text-white/40 text-[10px] font-medium uppercase tracking-widest">{opt.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NOTES */}
        {order.notes && (
          <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Delivery Notes</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{order.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
