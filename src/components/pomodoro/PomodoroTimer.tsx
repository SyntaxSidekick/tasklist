import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { pomodoroApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  taskId?: number;
  onClose?: () => void;
}

export default function PomodoroTimer({ taskId, onClose }: PomodoroTimerProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('pomodoro_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          const totalSeconds = state.minutes * 60 + state.seconds;
          const remaining = totalSeconds - elapsed;
          
          if (remaining > 0) {
            setMinutes(Math.floor(remaining / 60));
            setSeconds(remaining % 60);
            setIsRunning(true);
            setIsBreak(state.isBreak);
            startTimeRef.current = state.startTime;
          }
        }
      } catch (error) {
        console.error('Failed to load pomodoro state:', error);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              handleComplete();
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);

      // Save state
      const state = {
        minutes,
        seconds,
        isRunning,
        isBreak,
        startTime: startTimeRef.current,
      };
      localStorage.setItem('pomodoro_state', JSON.stringify(state));
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, minutes, seconds]);

  const handleComplete = async () => {
    setIsRunning(false);
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isBreak ? 'Break finished!' : 'Pomodoro completed!', {
        body: isBreak ? 'Time to get back to work' : 'Time for a break',
        icon: '/vite.svg',
      });
    }

    // Save session
    if (!isBreak) {
      try {
        await pomodoroApi.createSession({
          task_id: taskId,
          duration_minutes: 25,
          completed: 1,
        });
        setSessionCount((c) => c + 1);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }

    // Switch mode
    if (isBreak) {
      setMinutes(25);
      setIsBreak(false);
    } else {
      setMinutes(sessionCount % 4 === 3 ? 15 : 5); // Long break every 4 sessions
      setIsBreak(true);
    }
    setSeconds(0);
  };

  const handleStart = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    startTimeRef.current = Date.now();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    localStorage.removeItem('pomodoro_state');
  };

  const handleReset = () => {
    setIsRunning(false);
    setMinutes(isBreak ? 5 : 25);
    setSeconds(0);
    localStorage.removeItem('pomodoro_state');
  };

  const progress = ((isBreak ? 5 : 25) * 60 - (minutes * 60 + seconds)) / ((isBreak ? 5 : 25) * 60) * 100;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-20 w-72 p-6 rounded-app-lg shadow-2xl border border-border dark:border-gray-800 bg-white dark:bg-gray-900 z-40">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-text-muted hover:text-gray-900 dark:hover:text-white"
        >
          <X size={18} />
        </button>
      )}

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-1">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </h3>
        <p className="text-sm text-text-muted">Session #{sessionCount + 1}</p>
      </div>

      <div className="relative mb-6">
        <svg className="w-full h-40" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface dark:text-gray-800"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000',
              isBreak ? 'text-info' : 'text-primary'
            )}
            style={{
              strokeDasharray: 440,
              strokeDashoffset: 440 - (440 * progress) / 100,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-bold">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {!isRunning ? (
          <Button onClick={handleStart} className="w-24">
            <Play size={18} className="mr-1" />
            Start
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" className="w-24">
            <Pause size={18} className="mr-1" />
            Pause
          </Button>
        )}
        <Button onClick={handleReset} variant="ghost" size="sm">
          <RotateCcw size={18} />
        </Button>
      </div>
    </div>
  );
}
