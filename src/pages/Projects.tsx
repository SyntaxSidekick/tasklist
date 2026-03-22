import { useEffect, useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { useProjectsStore } from '@/store';
import Button from '@/components/ui/Button';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import Spinner from '@/components/ui/Spinner';

export default function ProjectsPage() {
  const { projects, setProjects } = useProjectsStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      if (response.success && response.data) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen size={28} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={20} className="mr-2" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onUpdate={loadProjects} />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}
