import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useView } from '@/contexts/ViewContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    Bell,
    Cog,
    LogOut,
    ChevronRight,
    User,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { Separator } from '@/components/ui/separator';

interface MobileSettingsSheetProps {
    open: boolean;
    onClose: () => void;
    onShowNotifications: () => void;
}

export function MobileSettingsSheet({
    open,
    onClose,
    onShowNotifications,
}: MobileSettingsSheetProps) {
    const { user, logout } = useAuth();
    const { isAdmin } = useView();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[85vh] overflow-y-auto">
                <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="text-left text-lg font-bold">Settings</SheetTitle>
                </SheetHeader>

                {/* Profile card */}
                <div className="px-6 pb-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
                        <Avatar className="w-14 h-14 ring-2 ring-primary/20 shrink-0">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                {user?.name?.split(' ').map((n) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.email || user?.phone}
                            </p>
                            {isAdmin && (
                                <Badge className="mt-1 bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Admin
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Menu items */}
                <div className="p-4 space-y-1">
                    <button
                        onClick={() => {
                            onClose();
                            onShowNotifications();
                        }}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Notifications</p>
                            <p className="text-xs text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/dashboard/project-settings');
                            }}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                                <Cog className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Project Settings</p>
                                <p className="text-xs text-muted-foreground">Manage members & preferences</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    )}
                </div>

                <Separator />

                <div className="p-4">
                    <Button
                        variant="outline"
                        className="w-full h-12 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive font-bold"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>

                <div className="h-safe-area-inset-bottom pb-4" />
            </SheetContent>
        </Sheet>
    );
}
