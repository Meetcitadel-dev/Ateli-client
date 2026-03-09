
import { useNavigate } from 'react-router-dom';
import { ProjectListScreen } from '@/components/home/ProjectListScreen';
import { useProject } from '@/contexts/ProjectContext';
import { useView } from '@/contexts/ViewContext';
import { Project } from '@/types';
import { toast } from 'sonner';

export default function ProjectsPage() {
    const { projects, setCurrentProject } = useProject();
    const { isAdmin } = useView();
    const navigate = useNavigate();

    const handleSelectProject = (project: Project) => {
        if (project.status === 'archived' && !isAdmin) {
            toast.error('This project is archived and can only be accessed by an admin.');
            return;
        }
        setCurrentProject(project);
        navigate('/dashboard/chat');
    };

    return (
        <ProjectListScreen
            projects={projects}
            onSelectProject={handleSelectProject}
        />
    );
}
