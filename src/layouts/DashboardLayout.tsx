
import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { Notification } from '@/types';
import { Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { currentProject } = useProject();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    if (!currentProject) {
        return <Navigate to="/projects" replace />;
    }

    const handleNotificationClick = (notification: Notification) => {
        setShowNotifications(false);
        if (notification.orderId) {
            navigate('/dashboard/orders');
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <div className={cn(
                    "transition-all duration-300 ease-in-out border-r border-sidebar-border bg-sidebar relative flex-shrink-0",
                    isCollapsed ? "w-20" : "w-72"
                )}>
                    <Sidebar
                        onShowNotifications={() => setShowNotifications(true)}
                        isCollapsed={isCollapsed}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-4 top-10 w-8 h-8 rounded-full border border-border bg-background shadow-md z-50 hover:bg-muted"
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                </div>
            )}

            {/* Mobile Navigation Trigger & Content Wrap */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                {isMobile && (
                    <header className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0 z-40">
                        <div className="flex items-center gap-3">
                            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                        <Menu className="w-6 h-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
                                    <Sidebar
                                        onShowNotifications={() => {
                                            setShowNotifications(true);
                                            setIsSidebarOpen(false);
                                        }}
                                        isCollapsed={false}
                                        isMobileView
                                    />
                                </SheetContent>
                            </Sheet>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">A</span>
                                </div>
                                <span className="font-semibold truncate max-w-[120px]">{currentProject.name}</span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowNotifications(true)}
                            className="relative text-muted-foreground hover:text-foreground"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                        </Button>
                    </header>
                )}

                <div className="flex-1 overflow-hidden relative">
                    <Outlet />
                </div>
            </main>

            {/* Notifications Panel - Overlay */}
            {showNotifications && (
                <NotificationsPanel
                    onClose={() => setShowNotifications(false)}
                    onNotificationClick={handleNotificationClick}
                />
            )}

            {/* Admin/User View Toggle */}
            <ViewToggle />
        </div>
    );
}

function ViewToggle() {
    const { viewMode, toggleViewMode } = useView();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-card border shadow-lg rounded-full p-1 pl-3 pr-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
                View: {viewMode === 'admin' ? 'Ateli Admin' : 'Client'}
            </span>
            <Button
                size="sm"
                variant={viewMode === 'admin' ? "default" : "outline"}
                className={cn(
                    "h-7 rounded-full text-xs px-3",
                    viewMode === 'admin' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                )}
                onClick={toggleViewMode}
            >
                Switch
            </Button>
        </div>
    );
}
