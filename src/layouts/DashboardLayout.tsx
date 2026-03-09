
import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { currentProject, setCurrentProject, projects, isLoading } = useProject();
    const { isAdmin } = useView();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Allow specific admin routes even without a current project
    const isBroadcastPage = location.pathname === '/dashboard/broadcast';

    // If data is still loading, show a centering loader
    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Initializing Ateli...</p>
            </div>
        );
    }

    // If no project selected and NOT on a page that allows it, redirect
    if (!currentProject && !isBroadcastPage) {
        return <Navigate to="/projects" replace />;
    }

    const handleNotificationClick = (notification: Notification) => {
        setShowNotifications(false);

        // Switch project if needed
        if (notification.projectId && (!currentProject || notification.projectId !== currentProject.id)) {
            const project = projects.find(p => p.id === notification.projectId);
            if (project) {
                setCurrentProject(project);
            }
        }

        // Navigate based on type
        if (notification.type === 'message') {
            navigate('/dashboard/chat');
        } else if (notification.type.startsWith('order_')) {
            if (notification.orderId) {
                navigate(`/dashboard/orders/${notification.orderId}`);
            } else {
                navigate('/dashboard/orders');
            }
        } else {
            navigate('/dashboard/chat');
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar - always shown on desktop */}
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

            {/* Mobile Sidebar for admin – sheet based */}
            {isMobile && isAdmin && (
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
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
            )}

            {/* Main content */}
            <main className={cn(
                "flex-1 flex flex-col overflow-hidden relative",
                isMobile && !isAdmin && "pb-16" // space for bottom nav
            )}>
                {/* Mobile Header */}
                {isMobile && (
                    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-40">
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <Menu className="w-6 h-6" />
                                </Button>
                            )}
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">A</span>
                                </div>
                                <span className="font-semibold truncate max-w-[140px]">
                                    {currentProject?.name || 'Ateli'}
                                </span>
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

            {/* Mobile Bottom Nav – only for non-admin users on mobile */}
            {isMobile && !isAdmin && (
                <MobileBottomNav />
            )}

            {/* Notifications Panel - Overlay */}
            {showNotifications && (
                <NotificationsPanel
                    onClose={() => setShowNotifications(false)}
                    onNotificationClick={handleNotificationClick}
                />
            )}
        </div>
    );
}
