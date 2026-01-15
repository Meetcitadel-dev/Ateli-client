import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { OrderCard } from './OrderCard';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
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
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusTabs: { id: OrderStatus | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Orders', icon: Package },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'approved', label: 'Approved', icon: CheckCircle2 },
  { id: 'shipped', label: 'In Transit', icon: Truck },
];

export function OrdersPanel() {
  const { currentProject } = useProject();
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const projectOrders = orders.filter(order => order.projectId === currentProject?.id);
  
  const filteredOrders = projectOrders.filter(order => {
    const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedApprovals = order.approvals.map(a => 
          a.userId === 'user-1' ? { ...a, action: 'approved' as const, timestamp: new Date() } : a
        );
        const allApproved = updatedApprovals.every(a => a.action === 'approved');
        return { 
          ...order, 
          approvals: updatedApprovals,
          status: allApproved ? 'approved' as const : order.status
        };
      }
      return order;
    }));
    toast.success('Order approved successfully');
  };

  const handleReject = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { 
          ...order, 
          status: 'rejected' as const,
          approvals: order.approvals.map(a => 
            a.userId === 'user-1' ? { ...a, action: 'rejected' as const, timestamp: new Date() } : a
          )
        };
      }
      return order;
    }));
    toast.error('Order rejected');
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Select a project to view orders</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <header className="px-8 py-6 border-b border-border bg-card">
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
        <div className="flex items-center gap-2">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' 
              ? projectOrders.length 
              : projectOrders.filter(o => o.status === tab.id).length;
            
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
                onApprove={handleApprove}
                onReject={handleReject}
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
