import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, ShoppingCart, ShoppingBag, Settings, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrders } from '@/contexts/OrderContext';
import { useProject } from '@/contexts/ProjectContext';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps { }

export function MobileBottomNav({ }: MobileBottomNavProps) {
    const { orders } = useOrders();
    const { currentProject } = useProject();

    const projectOrders = orders.filter(o => o.projectId === currentProject?.id);
    const orderCount = projectOrders.filter(o => o.status !== 'cart').length;
    const cartCount = projectOrders.filter(o => o.status === 'cart').length;

    const navItems = [
        {
            id: 'projects',
            label: 'Projects',
            icon: ShoppingBag,
            to: '/projects',
        },
        {
            id: 'chat',
            label: 'Chat',
            icon: MessageSquare,
            to: '/dashboard/chat',
            badge: currentProject?.unreadCount || 0,
        },
        {
            id: 'orders',
            label: 'Orders',
            icon: ShoppingBag,
            to: '/dashboard/orders',
            badge: orderCount,
        },
        {
            id: 'cart',
            label: 'Cart',
            icon: ShoppingCart,
            to: '/dashboard/cart',
            badge: cartCount,
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            to: '/dashboard/project-settings',
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-1 pb-safe h-20 safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            {navItems.map((item) => {
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 relative px-1',
                                isActive
                                    ? 'text-primary scale-110'
                                    : 'text-muted-foreground hover:text-foreground'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <Icon className={cn(
                                        'w-7 h-7 transition-all duration-300',
                                        isActive && 'fill-primary/10'
                                    )} />
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className={cn(
                                            "absolute text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border border-card shadow-sm",
                                            item.id === 'cart' ? "-top-2 -right-2 w-6 h-6 bg-amber-500 px-1" :
                                                item.id === 'chat' ? "-top-0.5 -right-0.5 w-3 h-3 bg-blue-500" :
                                                    "-top-1.5 -right-1.5 w-5 h-5 bg-primary",
                                            item.badge > 9 && item.id !== 'chat' && "px-1.5 w-auto h-5"
                                        )}>
                                            {item.id !== 'chat' && item.badge}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'text-[9px] font-bold uppercase tracking-tight',
                                        isActive ? 'text-primary opacity-100' : 'opacity-70'
                                    )}
                                >
                                    {item.label}
                                </span>
                                {isActive && (
                                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
