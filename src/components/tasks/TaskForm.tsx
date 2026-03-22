import { useState, useEffect } from 'react';
import { useProjectsStore, useLabelsStore } from '@/store';
import { projectsApi, labelsApi, tasksApi } from '@/lib/api';
import type { Task } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Task) => void;
  onCancel: () => void;
  defaultProjectId?: number;
}

export default function TaskForm({ task, onSubmit, onCancel, defaultProjectId }: TaskFormProps) {
  const { projects, setProjects } = useProjectsStore();
  const { setLabels } = useLabelsStore();
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 4);
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [dueTime, setDueTime] = useState(task?.due_time || '');
  const [projectId, setProjectId] = useState(task?.project_id || defaultProjectId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
    loadLabels();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.getAll();
      if (response.success && response.data) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadLabels = async () => {
    try {
      const response = await labelsApi.getAll();
      if (response.success && response.data) {
        setLabels(response.data.labels);
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        project_id: projectId ? Number(projectId) : undefined,
      };

      const response = task
        ? await tasksApi.update(task.id, data)
        : await tasksApi.create(data);

      if (response.success && response.data) {
        onSubmit(response.data.task);
      } else {
        setError(response.error || 'Failed to save task');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2 rounded-app bg-error/10 text-error text-sm">
          {error}
        </div>
      )}

      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />

      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3 | 4)}
          options={[
            { value: 1, label: 'P1 - Urgent' },
            { value: 2, label: 'P2 - High' },
            { value: 3, label: 'P3 - Medium' },
            { value: 4, label: 'P4 - Low' },
          ]}
        />

        {projects.length > 0 && (
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={[
              { value: '', label: 'No project' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Due date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <Input
          type="time"
          label="Due time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : task ? 'Update' : 'Add Task'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
