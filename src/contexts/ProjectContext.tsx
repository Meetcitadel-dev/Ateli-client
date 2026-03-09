
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Project } from '@/types';
import { db } from '@/services/db';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  getCurrentUserProjects: () => Project[];
  addProject: (project: Project) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  updateProjectSettings: (updates: Partial<Project>) => Promise<void>;
  updateMemberRole: (userId: string, role: string) => Promise<void>;
  updateMemberPermissions: (userId: string, permissions: any) => Promise<void>;
  updateMemberResponsibilities: (userId: string, responsibilities: any[]) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  inviteMember: (identifier: string, role: string) => Promise<void>;
  deleteProject: () => Promise<void>;
  archiveProject: () => Promise<void>;
  unarchiveProject: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const normalizePhone = (phone: string) => {
  // Remove all non-numeric characters except +
  return phone.replace(/[^0-9+]/g, '');
};

const phonesMatch = (p1: string, p2: string) => {
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (!n1 || !n2) return false;

  // Straight match
  if (n1 === n2) return true;

  // Last 10 digits match (common for India numbers with/without +91)
  const last10_1 = n1.slice(-10);
  const last10_2 = n2.slice(-10);
  return last10_1.length === 10 && last10_1 === last10_2;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }

    // Only show full loading state on the very first load
    // Subsequent re-fetches happen silently to avoid flash
    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    try {
      const userProjects = user.role === 'admin'
        ? await db.getAllProjects()
        : await db.getProjects(user.id);

      setProjects(userProjects);

      // Restore current project from localStorage or set first project
      const savedProjectId = localStorage.getItem('currentProjectId');
      const savedProject = userProjects.find(p => p.id === savedProjectId);

      if (savedProject) {
        setCurrentProject(savedProject);
      } else if (userProjects.length > 0 && !currentProject) {
        setCurrentProject(userProjects[0]);
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      toast.error(`Failed to load projects: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Save current project to localStorage
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProjectId', currentProject.id);
    }
  }, [currentProject]);

  // Global listener for new chat messages to update unread counts and show push notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`global-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as any;

          // If the message is from us, ignore
          if (newMsg.sender_id === user.id) return;
          if (newMsg.read_by && newMsg.read_by.includes(user.id)) return;

          // Increment the project's unreadCount
          setProjects(prev => prev.map(p => {
            if (p.id === newMsg.project_id) {
              return { ...p, unreadCount: (p.unreadCount || 0) + 1 };
            }
            return p;
          }));

          // Try to find the project name for a better notification
          const project = projects.find(p => p.id === newMsg.project_id);
          const projectNameStr = project ? ` in ${project.name}` : '';
          const title = `New message from ${newMsg.sender_name || 'someone'}${projectNameStr}`;

          // Try to deduce body based on type or content
          let body = newMsg.content;
          if (!body || body.trim() === '') {
            if (newMsg.type === 'image') body = '📷 Sent an image';
            else if (newMsg.type === 'voice') body = '🎤 Sent a voice message';
            else if (newMsg.type === 'document') body = '📄 Sent a document';
            else if (newMsg.type === 'location') body = '📍 Shared a location';
            else if (newMsg.type === 'order') body = '📦 Sent an order update';
            else body = 'New message';
          }

          // Show browser notification if permitted and in background
          if ("Notification" in window && Notification.permission === "granted") {
            if (document.hidden) {
              new Notification(title, { body });
            }
          }

          // Only show toast if we are NOT actively looking at this exact project right now, or if hidden
          if (document.hidden || currentProject?.id !== newMsg.project_id) {
            toast.info(title, { description: body });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentProject, projects]);

  const getCurrentUserProjects = useCallback(() => {
    return projects;
  }, [projects]);

  const addProject = useCallback(async (project: Project) => {
    if (!user) return;

    try {
      await db.saveProject(project, user.id);
      setProjects(prev => [...prev, project]);
      setCurrentProject(project);
      toast.success('Project created successfully');
    } catch (err: any) {
      console.error('Failed to create project:', err);
      toast.error(`Failed to create project: ${err.message}`);
      throw err;
    }
  }, [user]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    if (!user) return;

    try {
      await db.saveProject(updatedProject, user.id);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      if (currentProject?.id === updatedProject.id) {
        setCurrentProject(updatedProject);
      }
      toast.success('Project updated');
    } catch (err: any) {
      console.error('Failed to update project:', err);
      toast.error(`Failed to update project: ${err.message}`);
      throw err;
    }
  }, [user, currentProject]);

  const updateProjectSettings = useCallback(async (updates: Partial<Project>) => {
    if (!currentProject) return;

    try {
      await db.updateProjectSettings(currentProject.id, updates);
      const updatedProject = { ...currentProject, ...updates };
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      toast.success('Settings saved');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error(`Failed to save settings: ${err.message}`);
      throw err;
    }
  }, [currentProject]);

  const updateMemberRole = useCallback(async (userId: string, role: string) => {
    if (!currentProject) return;

    try {
      await db.updateMemberRole(currentProject.id, userId, role);

      // Update local state
      const updatedMembers = currentProject.members.map(m =>
        m.userId === userId ? { ...m, role: role as any } : m
      );
      const updatedProject = { ...currentProject, members: updatedMembers } as Project;
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      toast.success('Role updated');
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast.error(`Failed to update role: ${err.message}`);
      throw err;
    }
  }, [currentProject]);

  const updateMemberPermissions = useCallback(async (userId: string, permissions: any) => {
    if (!currentProject) return;

    try {
      await db.updateMemberPermissions(currentProject.id, userId, permissions);

      // Update local state
      const updatedMembers = currentProject.members.map(m =>
        m.userId === userId ? { ...m, permissions } : m
      );
      const updatedProject = { ...currentProject, members: updatedMembers } as Project;
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      toast.success('Permissions updated');
    } catch (err: any) {
      console.error('Failed to update permissions:', err);
      toast.error(`Failed to update permissions: ${err.message}`);
      throw err;
    }
  }, [currentProject]);
  const updateMemberResponsibilities = useCallback(async (userId: string, responsibilities: any[]) => {
    if (!currentProject) return;

    try {
      await db.updateMemberResponsibilities(currentProject.id, userId, responsibilities);

      // Update local state
      const updatedMembers = currentProject.members.map(m =>
        m.userId === userId ? { ...m, responsibilities } : m
      );
      const updatedProject = { ...currentProject, members: updatedMembers } as Project;
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      toast.success('Responsibilities updated');
    } catch (err: any) {
      console.error('Failed to update responsibilities:', err);
      toast.error(`Failed to update responsibilities: ${err.message}`);
      throw err;
    }
  }, [currentProject]);

  const removeMember = useCallback(async (userId: string) => {
    if (!currentProject) return;

    try {
      await db.removeProjectMember(currentProject.id, userId);

      // Update local state
      const updatedMembers = currentProject.members.filter(m => m.userId !== userId);
      const updatedProject = { ...currentProject, members: updatedMembers } as Project;
      setProjects(prev => prev.map(p => p.id === currentProject.id ? updatedProject : p));
      setCurrentProject(updatedProject);
      toast.success('Member removed');
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      toast.error(`Failed to remove member: ${err.message}`);
      throw err;
    }
  }, [currentProject]);

  const deleteProject = useCallback(async () => {
    if (!currentProject) return;

    try {
      await db.deleteProject(currentProject.id);
      setProjects(prev => prev.filter(p => p.id !== currentProject.id));
      setCurrentProject(null);
      toast.success('Project deleted');
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      toast.error(`Failed to delete project: ${err.message}`);
      throw err;
    }
  }, [currentProject]);

  const archiveProject = useCallback(async () => {
    if (!currentProject) return;
    try {
      await updateProjectSettings({ status: 'archived' });
      toast.success('Project archived');
    } catch (err: any) {
      console.error('Failed to archive project:', err);
      toast.error(`Failed to archive project: ${err.message}`);
      throw err;
    }
  }, [currentProject, updateProjectSettings]);

  const unarchiveProject = useCallback(async () => {
    if (!currentProject) return;
    try {
      await updateProjectSettings({ status: 'active' });
      toast.success('Project unarchived');
    } catch (err: any) {
      console.error('Failed to unarchive project:', err);
      toast.error(`Failed to unarchive project: ${err.message}`);
      throw err;
    }
  }, [currentProject, updateProjectSettings]);

  const inviteMember = useCallback(async (identifier: string, role: string) => {
    if (!currentProject) return;

    try {
      // Try finding user by identifier (phone or email)
      const allProfiles = await supabase.from('profiles').select('*');
      if (allProfiles.error) throw allProfiles.error;

      let targetUser = allProfiles.data.find(p =>
        (p.phone && phonesMatch(p.phone, identifier)) ||
        (p.email && p.email.toLowerCase() === identifier.toLowerCase())
      );

      if (!targetUser) {
        // If user not found, save as pending role
        await db.savePendingRole(currentProject.id, identifier, role);
        toast.success(`Invitation saved for ${identifier}. Role will be assigned when they join.`);
        return;
      }

      // Check if already a member
      if (currentProject.members.some(m => m.userId === targetUser!.id)) {
        toast.error('User is already a member of this project');
        return;
      }

      await db.addProjectMember(currentProject.id, targetUser.id, role);

      // Refresh projects to get updated member list
      await loadProjects();
      toast.success(`${targetUser.name} added to project`);
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      toast.error(`Failed to invite member: ${err.message}`);
      throw err;
    }
  }, [currentProject, loadProjects]);

  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  const markAsRead = useCallback(async (projectId: string) => {
    if (!user) return;
    try {
      await db.markMessagesAsRead(projectId, user.id);
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, unreadCount: 0 } : p
      ));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [user]);

  // Mark as read when project is selected
  useEffect(() => {
    if (currentProject && currentProject.unreadCount && currentProject.unreadCount > 0) {
      markAsRead(currentProject.id);
    }
  }, [currentProject, markAsRead]);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      isLoading,
      setCurrentProject,
      getCurrentUserProjects,
      addProject,
      updateProject,
      updateProjectSettings,
      updateMemberRole,
      updateMemberPermissions,
      updateMemberResponsibilities,
      removeMember,
      inviteMember,
      deleteProject,
      archiveProject,
      unarchiveProject,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
