import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { useTasksStore } from '@/store';
import TaskList from '@/components/tasks/TaskList';
import Spinner from '@/components/ui/Spinner';

export default function UpcomingPage() {
  const { tasks, setTasks } = useTasksStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksApi.getUpcoming();
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays size={28} className="text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Upcoming</h1>
        </div>
        <p className="text-text-muted">Next 7 days</p>
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner size={32} />
        </div>
      ) : (
        <TaskList tasks={tasks} onUpdate={loadTasks} />
      )}
    </div>
  );
}
