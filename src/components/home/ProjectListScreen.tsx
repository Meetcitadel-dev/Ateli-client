
import { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  MapPin,
  Users,
  Clock,
  Archive,
  Building2,
  MessageSquare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectListScreenProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: (name: string, address: string) => void;
}

export function ProjectListScreen({ projects, onSelectProject, onCreateProject }: ProjectListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.siteAddress.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = activeTab === 'active'
        ? project.status === 'active'
        : project.status === 'archived';
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return timeB - timeA;
    });

  const activeCount = projects.filter(p => p.status === 'active').length;
  const archivedCount = projects.filter(p => p.status === 'archived').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName && newProjectAddress) {
      onCreateProject(newProjectName, newProjectAddress);
      setNewProjectName('');
      setNewProjectAddress('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-base md:text-lg">A</span>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">Ateli</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Your Projects</p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-accent hover:bg-accent/90 gap-1 md:gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'archived')} className="flex-1 flex flex-col">
        <div className="px-4 md:px-6 py-3 border-b border-border bg-card/50">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              <Building2 className="w-4 h-4" />
              Active
              <Badge variant="secondary" className="ml-1">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="w-4 h-4" />
              Archived
              <Badge variant="secondary" className="ml-1">{archivedCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="flex-1 overflow-y-auto m-0 scrollbar-thin">
          <ProjectList projects={filteredProjects} onSelect={onSelectProject} />
        </TabsContent>

        <TabsContent value="archived" className="flex-1 overflow-y-auto m-0 scrollbar-thin">
          <ProjectList projects={filteredProjects} onSelect={onSelectProject} />
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl p-8 border border-border animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-foreground">New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Project Name</label>
                <Input
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Modern Villa Interior"
                  className="bg-background/50 border-border h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Site Address</label>
                <Input
                  required
                  value={newProjectAddress}
                  onChange={(e) => setNewProjectAddress(e.target.value)}
                  placeholder="e.g. Bandra West, Mumbai"
                  className="bg-background/50 border-border h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold shadow-lg"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects, onSelect }: { projects: Project[]; onSelect: (p: Project) => void }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No projects found</h3>
        <p className="text-muted-foreground">Create a new project to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => onSelect(project)}
          className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-4 group relative"
        >
          {/* Project Avatar */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative">
            <Building2 className="w-6 h-6 text-primary" />
            {project.unreadCount && project.unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-lg animate-pulse">
                {project.unreadCount > 9 ? '9+' : project.unreadCount}
              </span>
            ) : null}
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-foreground truncate",
                project.unreadCount && project.unreadCount > 0 ? "text-primary font-bold" : "text-foreground"
              )}>{project.name}</h3>
              {project.status === 'archived' && (
                <Badge variant="secondary" className="text-xs">Archived</Badge>
              )}
              {project.unreadCount && project.unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.siteAddress}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{project.members.length} members</span>
              </div>
              {project.lastActivity && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDistanceToNow(new Date(project.lastActivity), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquare className={cn(
              "w-5 h-5 transition-colors",
              project.unreadCount && project.unreadCount > 0 ? "text-primary opacity-100" : "text-muted-foreground opacity-20 group-hover:opacity-100"
            )} />
          </div>
        </button>
      ))}
    </div>
  );
}
