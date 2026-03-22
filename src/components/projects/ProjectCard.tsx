import { Link } from 'react-router-dom';
import { FolderOpen, MoreVertical } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onUpdate?: () => void;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-4 rounded-app-lg border border-border dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary/30 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-app flex items-center justify-center"
          style={{ backgroundColor: project.color }}
        >
          <FolderOpen size={20} className="text-white" />
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
          <MoreVertical size={18} className="text-text-muted" />
        </button>
      </div>

      <h3 className="font-semibold mb-1 text-lg">{project.name}</h3>

      <div className="text-sm text-text-muted">
        {project.active_task_count || 0} active tasks
      </div>
    </Link>
  );
}
