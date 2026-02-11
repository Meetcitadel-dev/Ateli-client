
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '@/types';
import { db } from '@/services/db';
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
  removeMember: (userId: string) => Promise<void>;
  inviteMember: (identifier: string, role: string) => Promise<void>;
  deleteProject: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userProjects = await db.getProjects(user.id);
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

  const inviteMember = useCallback(async (identifier: string, role: string) => {
    if (!currentProject) return;

    try {
      // Try finding by phone first, then email
      let targetUser = await db.findUserByPhone(identifier);
      if (!targetUser && identifier.includes('@')) {
        targetUser = await db.findUserByEmail(identifier);
      }

      if (!targetUser) {
        toast.error('User not found. They must have an Ateli account.');
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
      removeMember,
      inviteMember,
      deleteProject,
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
