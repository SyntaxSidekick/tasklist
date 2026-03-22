import { useMemo, useState, useEffect, useRef } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, getHours, getMinutes } from 'date-fns';
import type { Task } from '@/types';
import TaskModal from './TaskModal';

interface WeeklyViewProps {
  tasks: Task[];
  onUpdate: () => void;
}

interface PositionedTask extends Task {
  top: number;
  height: number;
}

export default function WeeklyView({ tasks, onUpdate }: WeeklyViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (scrollContainerRef.current && window.innerWidth < 768) {
      const currentDayIndex = weekDays.findIndex(day => isToday(day));
      if (currentDayIndex !== -1) {
        const dayColumnWidth = window.innerWidth * 0.85;
        const scrollPosition = currentDayIndex * dayColumnWidth;
        scrollContainerRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [weekDays]);

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getTaskDateTime = (task: Task): Date | null => {
    if (!task.due_date) return null;
    
    try {
      // Parse date as local date to avoid timezone issues
      const [year, month, day] = task.due_date.split('-').map(Number);
      const dateTime = new Date(year, month - 1, day);
      
      if (task.due_time) {
        // Add time component
        const [hours, minutes] = task.due_time.split(':');
        dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      
      return dateTime;
    } catch (error) {
      return null;
    }
  };

  const getTaskPosition = (task: Task): { top: number; height: number } => {
    const dateTime = getTaskDateTime(task);
    if (!dateTime) return { top: 0, height: 60 };
    
    const hours = getHours(dateTime);
    const minutes = getMinutes(dateTime);
    const hourHeight = 60;
    const top = hours * hourHeight + (minutes / 60) * hourHeight;
    const height = 60;
    return { top, height };
  };

  const tasksByDay = useMemo(() => {
    const grouped: { [key: string]: PositionedTask[] } = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        // Parse date as local date to avoid timezone issues
        const [year, month, dayNum] = task.due_date.split('-').map(Number);
        const taskDate = new Date(year, month - 1, dayNum);
        return isSameDay(taskDate, day);
      });
      
      grouped[dayKey] = dayTasks.map(task => ({
        ...task,
        ...getTaskPosition(task)
      }));
    });
    
    return grouped;
  }, [tasks, weekDays]);

  const formatTaskTime = (task: Task) => {
    const startTime = getTaskDateTime(task);
    if (!startTime) return '';
    try {
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
    } catch {
      return '';
    }
  };

  const getTaskColor = (task: Task) => {
    const now = new Date();
    const taskStart = getTaskDateTime(task);
    if (!taskStart) {
      if (task.project_color) {
        return `bg-[${task.project_color}] text-white`;
      }
      return 'bg-cyan-500 dark:bg-cyan-600 text-white';
    }
    const taskEnd = new Date(taskStart.getTime() + 60 * 60 * 1000);
    const isActive = now >= taskStart && now <= taskEnd;
    
    if (isActive) {
      return 'bg-primary text-white';
    }
    
    if (task.project_color) {
      return `bg-[${task.project_color}] text-white`;
    }
    
    return 'bg-cyan-500 dark:bg-cyan-600 text-white';
  };

  // Get current hour for highlighting
  const currentHour = new Date().getHours();

  return (
    <>
      <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-auto scroll-smooth max-h-[calc(100vh-200px)] scrollbar-hide">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[auto_repeat(7,85vw)] md:grid-cols-[60px_repeat(7,minmax(150px,1fr))]">
            <div className="sticky top-0 left-0 z-[110] bg-gray-50 dark:bg-gray-950">
              <div className="h-16 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 w-12 md:w-[60px]"></div>
            </div>
            {weekDays.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const isCurrentDay = isToday(day);
              
              return (
                <div key={dayKey} className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950">
                  <div className="h-16 flex flex-col items-center justify-center gap-1">
                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {format(day, 'EEE').toUpperCase()}
                    </div>
                    {isCurrentDay ? (
                      <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-normal">
                        {format(day, 'd')}
                      </div>
                    ) : (
                      <div className="text-xl font-normal text-gray-400 dark:text-gray-500">
                        {format(day, 'd')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {timeSlots.map(hour => {
              const isCurrentHour = hour === currentHour;
              
              return (
              <div key={`row-${hour}`} className="contents">
                <div className={`h-[60px] flex items-start justify-end pr-1 md:pr-2 pt-1 sticky left-0 z-[100] w-12 md:w-[60px] ${isCurrentHour ? 'bg-primary/5 dark:bg-primary/10' : 'bg-gray-50 dark:bg-gray-950'}`}>
                  <div className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                </div>

                {weekDays.map(day => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const isCurrentHourRow = isToday(day) && hour === currentHour;
                  
                  return (
                    <div 
                      key={`${dayKey}-${hour}`} 
                      className={`h-[60px] relative ${isCurrentHourRow ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                    >
                      {hour === 0 && tasksByDay[dayKey]?.map(task => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`absolute left-1 right-1 rounded-md px-3 py-2 text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ${getTaskColor(task)}`}
                          style={{
                            top: `${task.top}px`,
                            height: `${task.height - 2}px`,
                            zIndex: 5
                          }}
                        >
                          <div className="font-medium text-sm truncate">{task.title}</div>
                          <div className="text-xs opacity-90 truncate mt-0.5">{formatTaskTime(task)}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
            })}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
