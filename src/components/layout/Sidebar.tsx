import { useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  ShoppingCart, 
  Settings, 
  ChevronDown,
  Building2,
  Users,
  MapPin,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { currentUser } from '@/data/mockData';

interface SidebarProps {
  activeTab: 'chat' | 'orders' | 'settings';
  onTabChange: (tab: 'chat' | 'orders' | 'settings') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentProject, getCurrentUserProjects, setCurrentProject } = useProject();
  const userProjects = getCurrentUserProjects();
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  const navItems = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Ateli</span>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu open={isProjectMenuOpen} onOpenChange={setIsProjectMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button className="w-full p-3 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors text-left group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sidebar-primary" />
                  <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                    Project
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-sidebar-foreground/60 transition-transform",
                  isProjectMenuOpen && "rotate-180"
                )} />
              </div>
              <p className="font-semibold text-sidebar-foreground truncate">
                {currentProject?.name || 'Select Project'}
              </p>
              {currentProject?.siteAddress && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3 h-3 text-sidebar-foreground/40" />
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {currentProject.siteAddress.split(',')[0]}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-64 bg-card border-border"
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
                onClick={() => setCurrentProject(project)}
                className={cn(
                  "cursor-pointer p-3",
                  currentProject?.id === project.id && "bg-accent"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
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
            <DropdownMenuItem className="cursor-pointer p-3 text-accent">
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                activeTab === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'orders' && (
                <span className={cn(
                  "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                  activeTab === item.id
                    ? "bg-sidebar-primary-foreground/20"
                    : "bg-sidebar-accent text-sidebar-foreground/60"
                )}>
                  2
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
          <Avatar className="w-10 h-10 ring-2 ring-sidebar-primary/20">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
