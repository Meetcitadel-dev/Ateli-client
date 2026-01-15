import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '@/types';
import { mockProjects, currentUser } from '@/data/mockData';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  getCurrentUserProjects: () => Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects] = useState<Project[]>(mockProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(mockProjects[0]);

  const getCurrentUserProjects = () => {
    return projects.filter(project => 
      project.members.some(member => member.userId === currentUser.id)
    );
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      currentProject, 
      setCurrentProject,
      getCurrentUserProjects 
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
