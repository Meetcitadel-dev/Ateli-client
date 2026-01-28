import { useState } from 'react';
import { Project } from '@/types';
import { mockProjects } from '@/data/mockData';
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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectListScreenProps {
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

export function ProjectListScreen({ onSelectProject, onCreateProject }: ProjectListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.siteAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === 'active' 
      ? project.status === 'active' 
      : project.status === 'archived';
    return matchesSearch && matchesStatus;
  });

  const activeCount = mockProjects.filter(p => p.status === 'active').length;
  const archivedCount = mockProjects.filter(p => p.status === 'archived').length;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Ateli</h1>
              <p className="text-sm text-muted-foreground">Your Projects</p>
            </div>
          </div>
          <Button onClick={onCreateProject} className="bg-accent hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" />
            New Project
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
        <div className="px-6 py-3 border-b border-border bg-card/50">
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
          className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-4"
        >
          {/* Project Avatar */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
              {project.status === 'archived' && (
                <Badge variant="secondary" className="text-xs">Archived</Badge>
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
                  <span>{formatDistanceToNow(project.lastActivity, { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Unread indicator */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
