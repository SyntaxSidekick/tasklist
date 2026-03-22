import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Task } from '@/types';
import { tasksApi } from '@/lib/api';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onUpdate: () => void;
}

export default function TaskList({ tasks, onUpdate }: TaskListProps) {
  const [items, setItems] = useState(tasks);
  const [isDragging, setIsDragging] = useState(false);
  const isReordering = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync items with tasks prop, but skip during active reordering
  useEffect(() => {
    if (!isReordering.current) {
      setItems(tasks);
    }
  }, [tasks]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update order on server
      isReordering.current = true;
      try {
        const reorderedTasks = newItems.map((task, index) => ({
          id: task.id,
          order_index: index,
        }));
        await tasksApi.reorder(reorderedTasks);
        // Don't call onUpdate() to prevent resetting the order
      } catch (error) {
        console.error('Failed to reorder tasks:', error);
        setItems(tasks); // Revert on error
      } finally {
        isReordering.current = false;
      }
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No tasks yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={onUpdate} isDragging={isDragging} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
