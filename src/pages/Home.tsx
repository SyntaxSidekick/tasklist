import { useEffect, useState } from 'react';
import { Calendar, List, CalendarDays, Sparkles } from 'lucide-react';
import { tasksApi, projectsApi } from '@/lib/api';
import { useTasksStore, useProjectsStore } from '@/store';
import TaskList from '@/components/tasks/TaskList';
import WeeklyView from '@/components/tasks/WeeklyView';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { tasks, setTasks } = useTasksStore();
  const { setProjects } = useProjectsStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, [viewMode]);

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

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Fetch tasks based on view mode
      const response = viewMode === 'daily' 
        ? await tasksApi.getToday()
        : await tasksApi.getUpcoming(); // Use upcoming to get the week's tasks
      
      if (response.success && response.data) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    loadTasks();
    setShowForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Calendar size={28} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">
              {viewMode === 'weekly' ? 'This Week' : 'Home'}
            </h1>
          </div>
          
          {/* View Toggle & Voice Assistant */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceAssistant(true)}
              title="Voice Assistant - Data"
            >
              <Sparkles size={18} className="text-primary" />
              <span className="hidden sm:inline ml-2">Data</span>
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('weekly')}
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline ml-2">Weekly</span>
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('daily')}
            >
              <List size={16} />
              <span className="hidden sm:inline ml-2">Daily</span>
            </Button>
          </div>
        </div>
        <p className="text-text-muted mb-4">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {loading ? (
        <div className="py-12">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {viewMode === 'weekly' ? (
            <WeeklyView tasks={tasks} onUpdate={loadTasks} />
          ) : (
            <TaskList tasks={tasks} onUpdate={loadTasks} />
          )}

          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-text-muted hover:text-primary transition-colors"
          >
            + Add task
          </button>

          {showForm && (
            <TaskFormModal
              onClose={() => setShowForm(false)}
              onSuccess={handleTaskCreated}
            />
          )}
        </>
      )}

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <Modal
          isOpen={showVoiceAssistant}
          onClose={() => setShowVoiceAssistant(false)}
          title=""
        >
          <VoiceAssistant 
            onTaskCreated={loadTasks}
            onProjectCreated={loadProjects}
          />
        </Modal>
      )}
    </div>
  );
}
