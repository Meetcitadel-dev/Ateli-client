
import { useNavigate } from 'react-router-dom';
import { ProjectListScreen } from '@/components/home/ProjectListScreen';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';

export default function ProjectsPage() {
    const { projects, setCurrentProject, addProject } = useProject();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSelectProject = (project: Project) => {
        setCurrentProject(project);
        navigate('/dashboard/chat');
    };

    const handleCreateProject = async (name: string, address: string) => {
        if (!user) return;

        const newProject: Project = {
            id: `project-${Date.now()}`,
            name,
            siteAddress: address,
            status: 'active',
            members: [
                {
                    userId: user.id,
                    user: user,
                    role: 'owner',
                    joinedAt: new Date()
                }
            ],
            gstConfig: {
                enabled: false
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date()
        };

        try {
            await addProject(newProject);
            // Automatically select the new project
            setCurrentProject(newProject);
            navigate('/dashboard/chat');
        } catch (error) {
            console.error("Project creation failed", error);
        }
    };

    return (
        <ProjectListScreen
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
        />
    );
}
