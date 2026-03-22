import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { tasksApi, projectsApi } from '@/lib/api';
import { useTasksStore, useProjectsStore } from '@/store';
import type { Task } from '@/types';
import TaskList from '@/components/tasks/TaskList';
import TaskForm from '@/components/tasks/TaskForm';
import Spinner from '@/components/ui/Spinner';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { tasks, setTasks } = useTasksStore();
  const { currentProject, setCurrentProject } = useProjectsStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
      loadTasks();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsApi.getById(Number(id));
      if (response.success && response.data) {
        setCurrentProject(response.data.project);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await tasksApi.getAll({ project_id: Number(id), completed: 0 });
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks([...tasks, task]);
    setShowForm(false);
  };

  if (!currentProject) {
    return (
      <div className="p-12">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: currentProject.color }}
          />
          <h1 className="text-2xl md:text-3xl font-bold">{currentProject.name}</h1>
        </div>
        <p className="text-text-muted">
          {currentProject.active_task_count || 0} active tasks
        </p>
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <TaskList tasks={tasks} onUpdate={loadTasks} />

          {showForm ? (
            <div className="mt-4">
              <TaskForm
                onSubmit={handleTaskCreated}
                onCancel={() => setShowForm(false)}
                defaultProjectId={Number(id)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-text-muted hover:text-primary transition-colors"
            >
              + Add task
            </button>
          )}
        </>
      )}
    </div>
  );
}
