import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

export const formatDate = (date: string | Date): string => {
  let d: Date;
  
  if (typeof date === 'string') {
    // Check if it's a date-only string (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }
  
  if (isToday(d)) {
    return 'Today';
  }
  
  if (isTomorrow(d)) {
    return 'Tomorrow';
  }
  
  return format(d, 'MMM d, yyyy');
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isOverdue = (dueDate: string): boolean => {
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 1:
      return 'text-error';
    case 2:
      return 'text-warning';
    case 3:
      return 'text-info';
    default:
      return 'text-text-muted';
  }
};

export const getPriorityLabel = (priority: number): string => {
  return `P${priority}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const cn = (...classes: (string | boolean | undefined | Record<string, boolean>)[]) => {
  return classes
    .map((cls) => {
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return cls;
    })
    .filter(Boolean)
    .join(' ');
};
