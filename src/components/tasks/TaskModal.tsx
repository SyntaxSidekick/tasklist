import { useState } from 'react';
import { X, Flag, Calendar, Clock, FileText, Edit2, Trash2, Check } from 'lucide-react';
import type { Task } from '@/types';
import { tasksApi } from '@/lib/api';
import { formatDate, formatTime, getPriorityColor, isOverdue } from '@/lib/utils';
import Button from '@/components/ui/Button';
import TaskFormModal from './TaskFormModal';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  const [completing, setCompleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleToggleComplete = async () => {
    setCompleting(true);
    try {
      if (task.completed) {
        await tasksApi.uncomplete(task.id);
      } else {
        await tasksApi.complete(task.id);
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    
    try {
      await tasksApi.delete(task.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    onUpdate();
    onClose();
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'No Priority';
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-white dark:bg-gray-900 rounded-app-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border dark:border-gray-800 p-4 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className={`text-xl font-bold ${task.completed ? 'line-through text-text-muted' : ''}`}>
                {task.title}
              </h2>
              {task.project_name && (
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project_color }}
                  />
                  <span className="text-sm text-text-muted">{task.project_name}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-text-muted hover:text-text transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleComplete}
                disabled={completing}
                className={`rounded-full border-2 w-6 h-6 flex items-center justify-center transition-all ${
                  task.completed
                    ? 'bg-primary border-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                }`}
              >
                {task.completed && <Check size={16} className="text-white" />}
              </button>
              <span className={`font-medium ${task.completed ? 'text-success' : 'text-text-muted'}`}>
                {task.completed ? 'Completed' : 'Mark as complete'}
              </span>
            </div>

            {/* Description */}
            {task.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-muted">
                  <FileText size={18} />
                  <span className="font-medium">Description</span>
                </div>
                <p className="text-text ml-7 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Due Date & Time */}
            {task.due_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-muted">
                  <Calendar size={18} />
                  <span className="font-medium">Due Date</span>
                </div>
                <div className="ml-7 space-y-1">
                  <p className={`text-text ${isOverdue(task.due_date) && !task.completed ? 'text-error font-medium' : ''}`}>
                    {formatDate(task.due_date)}
                    {isOverdue(task.due_date) && !task.completed && ' (Overdue)'}
                  </p>
                  {task.due_time && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Clock size={14} />
                      <span>{formatTime(task.due_time)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Priority */}
            {task.priority < 4 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-muted">
                  <Flag size={18} />
                  <span className="font-medium">Priority</span>
                </div>
                <div className="ml-7">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    <Flag size={14} />
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              </div>
            )}

            {/* Subtasks */}
            {task.subtask_count && task.subtask_count > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-text-muted">
                  <Check size={18} />
                  <span className="font-medium">Subtasks</span>
                </div>
                <div className="ml-7">
                  <p className="text-text">
                    {task.completed_subtask_count || 0} of {task.subtask_count} completed
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-surface/80 dark:bg-gray-800/80 backdrop-blur border-t border-border dark:border-gray-800 p-4 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleEdit}
            >
              <Edit2 size={16} />
              <span className="ml-2">Edit</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="hover:bg-error hover:text-white"
            >
              <Trash2 size={16} />
              <span className="ml-2">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <TaskFormModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
