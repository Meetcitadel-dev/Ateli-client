import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from '@/contexts/AuthContext';
import { useView } from '@/contexts/ViewContext';
import { OrderCard } from './OrderCard';
import { OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  AlertCircle,
  MapPin,
  Loader2,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusTabs: { id: OrderStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Orders', icon: Package },
  { id: 'pending_confirmation', label: 'Pending', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { id: 'dispatched', label: 'In Transit', icon: Truck },
  { id: 'clarification_requested', label: 'Clarification', icon: AlertCircle },
];

export function OrdersPanel() {
  const { currentProject, isLoading } = useProject();
  const { user } = useAuth();
  const { isAdmin } = useView();
  const { getProjectOrders, approveOrder, rejectOrder } = useOrders();
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const projectOrders = currentProject ? getProjectOrders(currentProject.id).filter(o => o.status !== 'cart') : [];

  // Filter based on permissions
  const visibleOrders = projectOrders.filter(order => {
    if (!user || !currentProject) return false;

    // Admin (UI or Real) can see everything
    if (isAdmin || user.role === 'admin') return true;

    // Check member permission
    const member = currentProject.members.find(m => m.userId === user.id);

    // If they are a member of the project, they can see all project orders
    // This ensures they see orders created by admins or other team members
    return !!member;
  });

  const filteredOrders = visibleOrders.filter(order => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] h-full">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-white/20 text-xs font-black uppercase tracking-[0.2em]">Loading Projects...</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] h-full text-center p-8">
        <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
          <Briefcase className="w-8 h-8 text-white/20" />
        </div>
        <h3 className="text-xl font-black text-white italic tracking-tighter">No Project Selected</h3>
        <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-2 max-w-[240px] leading-relaxed">
          Select a project from the sidebar to view its orders
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] h-full overflow-hidden">
      {/* Header */}
      <header className="px-8 pt-10 pb-2">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Orders</h1>
          <p className="text-white/40 text-sm font-medium">
            Manage and track orders for {currentProject.name}
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none no-scrollbar">
          {statusTabs.map((tab) => {
            const count = tab.id === 'all'
              ? visibleOrders.length
              : visibleOrders.filter(o => o.status === tab.id).length;

            const isActive = activeStatus === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-200 whitespace-nowrap text-sm font-medium",
                  isActive
                    ? "bg-[#d4f45d] text-black shadow-lg shadow-[#d4f45d]/10"
                    : "bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-white/40")} />
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold",
                  isActive ? "bg-black/10" : "bg-white/10"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="px-8 pb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white/[0.03] border-white/5 focus:border-[#d4f45d]/30 rounded-xl text-white placeholder:text-white/20 transition-all font-medium text-sm"
          />
        </div>
        <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-white/40">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onApprove={(id) => approveOrder(id)}
                onReject={(id) => rejectOrder(id)}
                onClick={(o) => navigate(`/dashboard/orders/${o.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
              <ShoppingCart className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tighter">No orders found</h3>
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-2 max-w-[240px] leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search or status filter'
                : 'Orders created from your chats will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
