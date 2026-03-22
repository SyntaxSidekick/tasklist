import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Flag, Calendar, Trash2, Edit2, GripVertical } from 'lucide-react';
import type { Task } from '@/types';
import { tasksApi } from '@/lib/api';
import { formatTime, getPriorityColor, isOverdue, cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import TaskFormModal from './TaskFormModal';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  isDragging?: boolean;
  compact?: boolean;
}

export default function TaskItem({ task, onUpdate, isDragging = false, compact = false }: TaskItemProps) {
  const [completing, setCompleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleComplete = async () => {
    setCompleting(true);
    try {
      if (task.completed) {
        await tasksApi.uncomplete(task.id);
      } else {
        await tasksApi.complete(task.id);
      }
      onUpdate();
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
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const overdueClass = task.due_date && !task.completed && isOverdue(task.due_date)
    ? 'border-error/30 bg-error/5'
    : '';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-start gap-2 rounded-app border bg-white dark:bg-gray-900',
          'border-border dark:border-gray-800 hover:border-primary/30 transition-colors',
          task.completed && 'opacity-60',
          overdueClass,
          isCurrentlyDragging && 'opacity-50 shadow-lg',
          isDragging && 'cursor-grabbing',
          compact ? 'p-2' : 'p-3'
        )}
      >
        {/* Drag Handle - Hidden in compact mode */}
        {!compact && (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <GripVertical size={16} />
          </button>
        )}

        <button
          onClick={handleToggleComplete}
          disabled={completing}
          className={cn(
            'flex-shrink-0 mt-0.5 rounded-full border-2 transition-all',
            compact ? 'w-4 h-4' : 'w-5 h-5',
            task.completed
              ? 'bg-primary border-primary'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary'
          )}
        >
          {task.completed && <Check size={compact ? 12 : 16} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-medium',
                compact ? 'text-sm line-clamp-1' : '',
                task.completed && 'line-through text-text-muted'
              )}
            >
              {task.title}
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="p-1"
              >
                <Edit2 size={compact ? 14 : 16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="p-1 hover:text-error"
              >
                <Trash2 size={compact ? 14 : 16} />
              </Button>
            </div>
          </div>

          {!compact && task.description && (
            <p className="text-sm text-text-muted mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className={cn(
            'flex flex-wrap items-center gap-2 text-xs text-text-muted',
            compact ? 'mt-1' : 'mt-2 gap-3'
          )}>
            {task.priority < 4 && (
              <div className="flex items-center gap-1">
                <Flag size={12} className={getPriorityColor(task.priority)} />
                {!compact && <span className={getPriorityColor(task.priority)}>P{task.priority}</span>}
              </div>
            )}

            {task.due_time && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span className={isOverdue(task.due_date || '') && !task.completed ? 'text-error' : ''}>
                  {formatTime(task.due_time)}
                </span>
              </div>
            )}

            {!compact && task.project_name && (
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: task.project_color }}
                />
                <span>{task.project_name}</span>
              </div>
            )}

            {!compact && task.subtask_count && task.subtask_count > 0 && (
              <span>
                {task.completed_subtask_count || 0}/{task.subtask_count} subtasks
              </span>
            )}
          </div>
        </div>
      </div>

      {showEditModal && (
        <TaskFormModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
