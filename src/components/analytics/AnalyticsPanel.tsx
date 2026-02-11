import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useOrders } from '@/contexts/OrderContext';
import { Order, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvoiceEditor } from './InvoiceEditor';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  FileDown,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  FileText,
  Plus,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Mock invoice storage (in a real app, this would be in a context or database)
const invoiceStorage: Record<string, Invoice> = {};

export function AnalyticsPanel() {
  const { currentProject } = useProject();
  const { orders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoices, setInvoices] = useState<Record<string, Invoice>>(invoiceStorage);

  const projectOrders = orders.filter(o => o.projectId === currentProject?.id);

  // Calculate aggregate stats
  const totalOrders = projectOrders.length;
  const totalValue = projectOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const ordersByStatus = projectOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deliveryStats = {
    onTime: projectOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
    delayed: projectOrders.filter(o => o.status === 'on_hold').length,
    cancelled: projectOrders.filter(o => o.status === 'cancelled').length,
  };

  // Calculate stats by member
  const uniqueInitiators = Array.from(new Set(projectOrders.map(o => o.initiatedBy))).filter(Boolean);
  const memberStats = uniqueInitiators.map(userId => {
    const userOrders = projectOrders.filter(o => o.initiatedBy === userId);
    const userName = userOrders[0]?.createdByName || 'Unknown Member';
    return {
      userId,
      userName,
      orderCount: userOrders.length,
      totalValue: userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  const handleExportAll = () => {
    // Generate CSV export of all project orders
    const headers = ['Order Number', 'Status', 'Items', 'Total Amount', 'Created By', 'Created At', 'Delivery Date'];
    const rows = projectOrders.map(order => [
      order.orderNumber,
      order.status.replace(/_/g, ' '),
      order.items.map(i => `${i.name} x${i.quantity}`).join('; '),
      `₹${order.totalAmount.toLocaleString()}`,
      order.createdByName || 'Unknown',
      format(new Date(order.createdAt), 'dd MMM yyyy'),
      order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM yyyy') : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${currentProject?.name || 'project'}_orders_export.csv`;
    link.click();

    toast.success(`Exported ${projectOrders.length} orders to CSV`);
  };

  const hasInvoice = (orderId: string) => !!invoices[orderId];

  const handleSaveInvoice = (invoice: Partial<Invoice>) => {
    if (invoice.orderId) {
      setInvoices(prev => ({
        ...prev,
        [invoice.orderId!]: invoice as Invoice
      }));
    }
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'dispatched':
        return 'bg-info/10 text-info border-info/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'on_hold':
      case 'clarification_requested':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 bg-muted/20">
        <Briefcase className="w-16 h-16 text-muted-foreground/20" />
        <div>
          <h3 className="text-xl font-bold">No Project Selected</h3>
          <p className="text-muted-foreground">Select a project to view its performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Live performance data for <span className="font-semibold text-foreground underline decoration-primary/30">{currentProject.name}</span>
              </p>
            </div>
            <Button onClick={handleExportAll} className="gap-2 bg-black text-white hover:bg-black/80 font-bold border-2 border-black">
              <FileDown className="w-4 h-4" />
              Export All Orders
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{totalOrders}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-success">₹</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">₹{totalValue.toLocaleString()}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-info" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{deliveryStats.onTime}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{totalOrders - (deliveryStats.onTime + deliveryStats.cancelled)}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List with Invoice Actions */}
          <Card className="border-2 border-muted/50 shadow-none rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                All Orders & Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {projectOrders.length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No orders in this project</p>
                  <p className="text-sm text-muted-foreground">Orders will appear here once created</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {projectOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                          <Package className="w-5 h-5 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-bold text-sm">{order.orderNumber}</p>
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                              {order.status.replace(/_/g, ' ')}
                            </Badge>
                            {hasInvoice(order.id) && (
                              <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                                Invoice Created
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {order.createdByName || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            Created {format(new Date(order.createdAt), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg tabular-nums">₹{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Order Value</p>
                        </div>

                        <Button
                          variant={hasInvoice(order.id) ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className={`gap-2 min-w-[140px] ${hasInvoice(order.id)
                            ? 'border-2 hover:bg-muted'
                            : 'bg-black text-white hover:bg-black/80'
                            }`}
                        >
                          {hasInvoice(order.id) ? (
                            <>
                              <Eye className="w-4 h-4" />
                              View Invoice
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Create Invoice
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Attribution by Member */}
            <Card className="border-2 border-muted/50 shadow-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {memberStats.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <p>No orders recorded for attribution</p>
                    </div>
                  ) : (
                    memberStats.map(({ userId, userName, orderCount, totalValue: memberTotal }) => (
                      <div key={userId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                              <span className="text-sm font-bold text-primary">
                                {userName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-sm leading-none">{userName}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-medium">{orderCount} orders initiated</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">₹{memberTotal.toLocaleString()}</p>
                            <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground opacity-60">Share: {((memberTotal / (totalValue || 1)) * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        <Progress
                          value={(memberTotal / (totalValue || 1)) * 100}
                          className="h-2 bg-muted rounded-full overflow-hidden"
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {/* Delivery Stats */}
              <Card className="border-2 border-muted/50 shadow-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Delivery Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-3xl bg-success/5 border border-success/10 space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                      <p className="text-2xl font-bold text-success tabular-nums">{deliveryStats.onTime}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center p-4 rounded-3xl bg-warning/5 border border-warning/10 space-y-1">
                      <Clock className="w-6 h-6 text-warning mx-auto mb-1" />
                      <p className="text-2xl font-bold text-warning tabular-nums">{deliveryStats.delayed}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">On Hold</p>
                    </div>
                    <div className="text-center p-4 rounded-3xl bg-destructive/5 border border-destructive/10 space-y-1">
                      <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
                      <p className="text-2xl font-bold text-destructive tabular-nums">{deliveryStats.cancelled}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Status Breakdown */}
              <Card className="border-2 border-muted/50 shadow-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle className="text-lg font-bold">Status Lifecycle</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ordersByStatus)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                        <Badge
                          key={status}
                          variant="outline"
                          className="text-xs py-1.5 px-4 rounded-full font-bold bg-muted/20 border-border/50 hover:bg-muted/40 transition-colors uppercase tracking-tight"
                        >
                          {status.replace(/_/g, ' ')}: <span className="text-primary ml-1">{count}</span>
                        </Badge>
                      ))}
                    {totalOrders === 0 && (
                      <p className="text-muted-foreground text-sm py-4 italic">No lifecycle data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Invoice Editor Modal */}
      {selectedOrder && (
        <InvoiceEditor
          order={selectedOrder}
          existingInvoice={invoices[selectedOrder.id] || null}
          onClose={() => setSelectedOrder(null)}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );
}
