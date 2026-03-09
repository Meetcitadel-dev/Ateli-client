import { useState } from 'react';
import { useOrders } from '@/contexts/OrderContext';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminOrderForm } from '@/components/chat/AdminOrderForm';
import {
    ShoppingCart,
    CheckCircle2,
    XCircle,
    MessageCircle,
    Package,
    IndianRupee,
    AlertCircle,
    ChevronRight,
    Loader2,
    Edit2,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function CartPanel() {
    const { orders, approveOrder, rejectOrder, deleteOrder, updateOrder } = useOrders();
    const { currentProject } = useProject();
    const { isAdmin } = useView();
    const { sendMessage } = useChat();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [denyingId, setDenyingId] = useState<string | null>(null);
    const [editingCart, setEditingCart] = useState<Order | null>(null);

    const projectMember = currentProject?.members.find(m => m.userId === user?.id);
    const isApprover = projectMember?.responsibilities?.includes('approver') || projectMember?.responsibilities?.includes('owner') || isAdmin;

    const cartOrders = orders.filter(
        (o) => o.projectId === currentProject?.id && o.status === 'cart'
    );

    const handleUpdateCart = async (items: any[]) => {
        if (!editingCart) return;

        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const updatedItems = items.map(item => ({
            id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name,
            description: item.description || 'Cart Item',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            isConfirmed: false,
        }));

        try {
            await updateOrder(editingCart.id, {
                items: updatedItems,
                totalAmount: totalAmount,
                updatedAt: new Date()
            });
            setEditingCart(null);
            toast.success(`Cart ${editingCart.orderNumber} updated`);
        } catch {
            toast.error('Failed to update cart');
        }
    };

    const handleApprove = async (order: Order) => {
        setApprovingId(order.id);
        try {
            // Convert cart to a real order
            await approveOrder(order.id);
            toast.success(`Cart ${order.orderNumber} approved — order placed!`);
        } catch {
            toast.error('Failed to approve cart');
        } finally {
            setApprovingId(null);
        }
    };

    const handleDeny = async (order: Order) => {
        setDenyingId(order.id);
        try {
            await deleteOrder(order.id);
            toast.info(`Cart ${order.orderNumber} denied and removed.`);
        } catch {
            toast.error('Failed to deny cart');
        } finally {
            setDenyingId(null);
        }
    };

    const handleItemConcern = async (order: Order, itemName: string) => {
        const msg = `📦 Concern about item: *${itemName}* in cart ${order.orderNumber} — `;
        await sendMessage(msg, 'text', { isFromAteli: false });
        toast.success('Item details sent to admin chat. Add your concern in the chat!');
        navigate('/dashboard/chat');
    };

    if (!currentProject) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-primary/20 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Project Selected</h3>
                <p className="text-muted-foreground">Select a project to view carts.</p>
            </div>
        );
    }

    if (cartOrders.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <ShoppingCart className="w-10 h-10 text-primary/30" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Carts Pending</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                    {isAdmin
                        ? 'Create a cart from the Chat panel to send an order for user approval.'
                        : 'No carts have been prepared for your review yet. The admin will send one when ready.'}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Cart</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {cartOrders.length} cart{cartOrders.length > 1 ? 's' : ''} pending review
                        </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {cartOrders.length} Pending
                    </Badge>
                </div>

                {/* Cart Cards */}
                {cartOrders.map((cart) => {
                    const isApproving = approvingId === cart.id;
                    const isDenying = denyingId === cart.id;
                    const isProcessing = isApproving || isDenying;

                    return (
                        <Card
                            key={cart.id}
                            className="border border-border shadow-sm overflow-hidden"
                        >
                            {/* Cart Header */}
                            <CardHeader className="bg-muted/30 border-b border-border pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">{cart.orderNumber}</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Created {format(new Date(cart.createdAt), 'MMM d, yyyy · h:mm a')}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    onClick={() => setEditingCart(cart)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeny(cart)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 text-[10px] uppercase font-bold tracking-wider"
                                        >
                                            {isAdmin ? 'Read Only (User Approval)' : 'Awaiting Approval'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {/* Items */}
                                <ScrollArea className="max-h-80">
                                    <div className="divide-y divide-border">
                                        {cart.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between px-4 md:px-6 py-3.5 hover:bg-muted/20 transition-colors group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-muted-foreground">
                                                            Qty: <strong>{item.quantity}</strong>
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">×</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ₹{item.unitPrice.toLocaleString()}/unit
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="font-bold text-sm text-foreground">
                                                        ₹{item.totalPrice.toLocaleString()}
                                                    </span>
                                                    {/* Concern button – only for non-admin users */}
                                                    {!isAdmin && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                            title="Send concern to admin"
                                                            onClick={() => handleItemConcern(cart, item.name)}
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Concern hint */}
                                {!isAdmin && (
                                    <div className="mx-4 md:mx-6 my-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Hover over any item and tap the{' '}
                                            <MessageCircle className="w-3 h-3 inline" /> icon to send a concern to
                                            admin about that specific item.
                                        </p>
                                    </div>
                                )}

                                {/* Total Row */}
                                <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-muted/30 border-t border-border">
                                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <IndianRupee className="w-3.5 h-3.5" /> Total
                                    </span>
                                    <span className="text-xl font-black text-primary">
                                        ₹{cart.totalAmount.toLocaleString()}
                                    </span>
                                </div>

                                {/* Actions – only for users with Approver or Owner responsibility */}
                                {isApprover ? (
                                    <div className="flex gap-3 p-4 md:p-6 border-t border-border bg-background">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-12 gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive font-bold uppercase tracking-widest text-[10px]"
                                            onClick={() => handleDeny(cart)}
                                            disabled={isProcessing}
                                        >
                                            {isDenying ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Deny
                                        </Button>
                                        <Button
                                            className="flex-1 h-12 gap-2 bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                                            onClick={() => handleApprove(cart)}
                                            disabled={isProcessing}
                                        >
                                            {isApproving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            Approve & Place Order
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 md:px-6 border-t border-border bg-muted/10">
                                        <p className="text-xs text-muted-foreground text-center">
                                            Only users with Approver or Owner responsibility can approve carts
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Sheet open={!!editingCart} onOpenChange={(open) => !open && setEditingCart(null)}>
                <SheetContent side="right" className="p-0 sm:max-w-[100vw] md:max-w-[750px] border-l-0">
                    {editingCart && (
                        <AdminOrderForm
                            title={`Edit Cart ${editingCart.orderNumber}`}
                            initialItems={editingCart.items.map(item => ({
                                id: item.id,
                                name: item.name,
                                quantity: item.quantity,
                                price: item.unitPrice
                            }))}
                            onSubmit={handleUpdateCart}
                            onSubmitCart={handleUpdateCart}
                            onCancel={() => setEditingCart(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
