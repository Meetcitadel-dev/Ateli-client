import { mockProjectAnalytics, mockOrders, mockUsers } from '@/data/mockData';
import { useProject } from '@/contexts/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  FileDown,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';

export function AnalyticsPanel() {
  const { currentProject } = useProject();
  const analytics = mockProjectAnalytics;
  
  const projectOrders = mockOrders.filter(o => o.projectId === currentProject?.id);
  
  // Calculate stats by member
  const memberStats = mockUsers.slice(0, 3).map(user => {
    const userOrders = projectOrders.filter(o => o.initiatedBy === user.id);
    return {
      user,
      orderCount: userOrders.length,
      totalValue: userOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  });

  const handleExportExcel = () => {
    toast.success('Generating Excel report...');
  };

  const handleDownloadInvoices = () => {
    toast.success('Preparing invoices for download...');
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a project to view analytics</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">{currentProject.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadInvoices} className="gap-2">
            <FileDown className="w-4 h-4" />
            Download Invoices
          </Button>
          <Button onClick={handleExportExcel} className="gap-2 bg-success hover:bg-success/90">
            <FileDown className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{analytics.totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.deliveryStats.onTime}</p>
                <p className="text-sm text-muted-foreground">On-Time Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.ordersByStatus.pending_confirmation}</p>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Attribution by Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Order Attribution by Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberStats.map(({ user, orderCount, totalValue }) => (
              <div key={user.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{orderCount} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{totalValue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total value</p>
                  </div>
                </div>
                <Progress 
                  value={(totalValue / analytics.totalValue) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Delivery Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-success/10">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">{analytics.deliveryStats.onTime}</p>
              <p className="text-sm text-muted-foreground">On Time</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10">
              <Clock className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">{analytics.deliveryStats.delayed}</p>
              <p className="text-sm text-muted-foreground">Delayed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/10">
              <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">{analytics.deliveryStats.cancelled}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.ordersByStatus)
              .filter(([_, count]) => count > 0)
              .map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-sm py-1 px-3">
                  {status.replace(/_/g, ' ')}: {count}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
