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
  AlertCircle
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
  const { currentProject } = useProject();
  const { user } = useAuth();
  const { isAdmin } = useView();
  const { getProjectOrders, approveOrder, rejectOrder } = useOrders();
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const projectOrders = currentProject ? getProjectOrders(currentProject.id) : [];

  // Filter based on permissions
  const visibleOrders = projectOrders.filter(order => {
    if (!user || !currentProject) return false;

    // Admin (UI or Real) can see everything
    if (isAdmin || user.role === 'admin') return true;

    // Check member permission
    const member = currentProject.members.find(m => m.userId === user.id);
    if (!member) return false;

    // Owners can see everything
    if (member.role === 'owner') return true;

    // If viewAllOrders is explicitly false, only show their own orders
    if (member.permissions?.viewAllOrders === false) {
      return order.createdBy === user.id;
    }

    return true;
  });

  const filteredOrders = visibleOrders.filter(order => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Select a project to view orders</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 md:py-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track orders for {currentProject.name}
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Plus className="w-4 h-4" />
            Request Quote
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none flex-nowrap md:flex-wrap">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all'
              ? visibleOrders.length
              : visibleOrders.filter(o => o.status === tab.id).length;

            return (
              <Button
                key={tab.id}
                variant={activeStatus === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveStatus(tab.id)}
                className={cn(
                  "gap-2",
                  activeStatus === tab.id && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1",
                    activeStatus === tab.id && "bg-primary-foreground/20 text-primary-foreground"
                  )}
                >
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </header>

      {/* Search and Filter */}
      <div className="px-8 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No orders found</h3>
            <p className="text-muted-foreground max-w-sm">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Orders created from your chats will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
