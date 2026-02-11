import { User } from '@/types';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useView } from '@/contexts/ViewContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  ShoppingCart,
  ChevronDown,
  Building2,
  Users,
  MapPin,
  Plus,
  Bell,
  Wallet,
  BarChart3,
  ArrowLeft,
  Cog,
  LogOut,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockNotifications } from '@/data/mockData';
import { toast } from 'sonner';

interface SidebarProps {
  onShowNotifications: () => void;
  isCollapsed?: boolean;
  isMobileView?: boolean;
}

export function Sidebar({ onShowNotifications, isCollapsed = false, isMobileView = false }: SidebarProps) {
  const { currentProject, getCurrentUserProjects, setCurrentProject } = useProject();
  const { getProjectOrders } = useOrders();
  const { user, logout, updateUserProfile } = useAuth();
  const userProjects = getCurrentUserProjects();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<Partial<User>>({});
  const navigate = useNavigate();

  const unreadNotifications = mockNotifications.filter(n => !n.isRead).length;
  const projectOrderCount = currentProject ? getProjectOrders(currentProject.id).length : 0;

  const { isAdmin } = useView();

  const allNavItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/dashboard/chat' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: projectOrderCount, path: '/dashboard/orders' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/dashboard/wallet' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { id: 'project-config', label: 'Project Settings', icon: Cog, path: '/dashboard/project-settings' },
  ];

  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter(item => !['analytics', 'project-config'].includes(item.id));

  const handleProjectSelect = (project: any) => {
    setCurrentProject(project);
    navigate('/dashboard/chat');
  };

  return (
    <>
      <aside className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-20" : "w-full lg:w-72"
      )}>
        {/* Logo & Back */}
        <div className={cn(
          "border-b border-sidebar-border",
          isCollapsed ? "p-4" : "p-6"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-md shrink-0">
                <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
              </div>
              {!isCollapsed && <span className="text-xl font-semibold tracking-tight">Ateli</span>}
            </div>
            {!isCollapsed && !isMobileView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/projects')}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Project Selector */}
        <div className={cn(
          "border-b border-sidebar-border",
          isCollapsed ? "p-4" : "p-4"
        )}>
          <DropdownMenu open={isProjectMenuOpen} onOpenChange={setIsProjectMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-all text-left group border border-transparent hover:border-sidebar-border/50",
                isCollapsed ? "p-2 flex justify-center" : "p-3"
              )}>
                {isCollapsed ? (
                  <Building2 className="w-5 h-5 text-sidebar-primary" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sidebar-primary" />
                        <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                          Project
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-sidebar-foreground/60 transition-transform duration-200",
                        isProjectMenuOpen && "rotate-180"
                      )} />
                    </div>
                    <p className="font-semibold text-sidebar-foreground truncate">
                      {currentProject?.name || 'Select Project'}
                    </p>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "start"}
              className="w-64 bg-background border-border shadow-soft"
              sideOffset={8}
            >
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Your Projects
                </p>
              </div>
              {userProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={cn(
                    "cursor-pointer p-3 focus:bg-sidebar-accent",
                    currentProject?.id === project.id && "bg-sidebar-accent"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.status === 'archived' && (
                        <Badge variant="secondary" className="text-xs">Archived</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {project.members.length} members
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer p-3 text-sidebar-primary focus:text-sidebar-primary focus:bg-sidebar-accent">
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-1 overflow-y-auto scrollbar-thin",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => cn(
                  "w-full flex items-center gap-3 rounded-lg transition-all duration-200 group relative",
                  isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
                {item.id === 'orders' && item.badge > 0 && !isCollapsed && (
                  <span className={cn(
                    "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full transition-colors",
                    "bg-sidebar-accent/50 text-sidebar-foreground/80 group-[.active]:bg-white/20 group-[.active]:text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary-foreground rounded-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Notifications */}
        <div className={cn(
          "border-t border-sidebar-border",
          isCollapsed ? "p-2" : "p-4"
        )}>
          <button
            onClick={onShowNotifications}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3"
            )}
          >
            <Bell className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Notifications</span>}
            {unreadNotifications > 0 && !isCollapsed && (
              <Badge className="ml-auto bg-destructive text-destructive-foreground">
                {unreadNotifications}
              </Badge>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className={cn(
          "border-t border-sidebar-border bg-sidebar/50",
          isCollapsed ? "p-2" : "p-4"
        )}>
          <div
            onClick={() => {
              setTempProfile({ name: user?.name, phone: user?.phone, avatar: user?.avatar });
              setIsProfileModalOpen(true);
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group",
              isCollapsed ? "p-2 justify-center" : "p-3"
            )}
          >
            <Avatar className="w-10 h-10 ring-2 ring-sidebar-primary/20 group-hover:ring-sidebar-primary/40 transition-all shrink-0">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{user?.name}</p>
                  <Cog className="w-3.5 h-3.5 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors" />
                </div>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  ₹{user?.walletBalance.toLocaleString()} wallet
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background w-[90%] max-w-md rounded-2xl shadow-2xl p-6 border border-border animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">Profile Settings</h2>

            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Full Name</Label>
                <Input
                  type="text"
                  defaultValue={user?.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-muted/30 border-border focus:ring-primary/20 h-11 rounded-xl"
                  placeholder="Enter your name"
                />
              </div>

              {user?.role === 'admin' ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Admin Email</Label>
                  <Input
                    type="email"
                    value={user?.email}
                    disabled
                    className="bg-muted/50 border-border/50 h-11 rounded-xl opacity-70"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">Email is read-only for admin accounts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mobile Number</Label>
                  <Input
                    type="tel"
                    value={user?.phone}
                    disabled
                    className="bg-muted/50 border-border/50 h-11 rounded-xl opacity-70"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">Phone number is linked to your account</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all"
                onClick={async () => {
                  try {
                    await updateUserProfile(tempProfile);
                    setIsProfileModalOpen(false);
                    toast.success("Profile updated successfully");
                  } catch (err) {
                    toast.error("Failed to update profile");
                  }
                }}
              >
                Save Changes
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
