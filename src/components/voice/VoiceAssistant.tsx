import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { tasksApi, projectsApi } from '@/lib/api';
import { useProjectsStore, useTasksStore } from '@/store';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns';

interface VoiceAssistantProps {
  onTaskCreated?: () => void;
  onProjectCreated?: () => void;
}

interface ConversationContext {
  lastProject?: string;
  lastTask?: string;
  expectingResponse?: 'task_name' | 'project_name' | 'confirmation';
  pendingAction?: any;
}

export default function VoiceAssistant({ onTaskCreated, onProjectCreated }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'wake-listening' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [context, setContext] = useState<ConversationContext>({});
  
  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const { projects } = useProjectsStore();
  const { tasks } = useTasksStore();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Main command recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('listening');
      setMessage('');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setStatus('processing');
      processCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setStatus('error');
        setMessage(`I encountered an error: ${event.error}`);
        speak(`I encountered an error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart wake word listening if it was active
      if (isWakeWordActive) {
        setTimeout(() => startWakeWordListening(), 500);
      }
    };

    recognitionRef.current = recognition;

    // Wake word recognition
    const wakeWordRecognition = new SpeechRecognition();
    wakeWordRecognition.continuous = true;
    wakeWordRecognition.interimResults = true;
    wakeWordRecognition.lang = 'en-US';

    wakeWordRecognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
        .toLowerCase();

      // Check for wake words
      if (transcript.includes('hey data') || transcript.includes('hey, data') || transcript.includes('ok data')) {
        wakeWordRecognition.stop();
        setIsWakeWordActive(false);
        setStatus('listening');
        speak('Yes? I\'m listening.');
        setTimeout(() => {
          recognitionRef.current?.start();
          setIsListening(true);
        }, 800);
      }
    };

    wakeWordRecognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      console.error('Wake word error:', event.error);
      // Auto-restart on error if wake word mode is still active
      if (isWakeWordActive) {
        setTimeout(() => startWakeWordListening(), 1000);
      }
    };

    wakeWordRecognition.onend = () => {
      // Auto-restart if wake word mode is still active
      if (isWakeWordActive) {
        setTimeout(() => startWakeWordListening(), 500);
      }
    };

    wakeWordRecognitionRef.current = wakeWordRecognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, [isWakeWordActive]);

  const startWakeWordListening = () => {
    try {
      wakeWordRecognitionRef.current?.start();
      setStatus('wake-listening');
    } catch (error) {
      console.error('Failed to start wake word listening:', error);
    }
  };

  const toggleWakeWord = () => {
    if (isWakeWordActive) {
      wakeWordRecognitionRef.current?.stop();
      setIsWakeWordActive(false);
      setStatus('idle');
    } else {
      setIsWakeWordActive(true);
      startWakeWordListening();
    }
  };

  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!isSupported) {
      setMessage('Speech recognition is not supported in your browser');
      setStatus('error');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('idle');
      setMessage('');
    } else {
      setTranscript('');
      setMessage('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  };

  const respondWithSuccess = (message: string) => {
    setStatus('success');
    setMessage(message);
    speak(message);
    
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
      setTranscript('');
    }, 5000);
  };

  const respondWithError = (error: string) => {
    setStatus('error');
    setMessage(error);
    speak(error);
    
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
      setTranscript('');
    }, 5000);
  };

  const parseDateTime = (command: string): { date?: string; time?: string } => {
    const result: { date?: string; time?: string } = {};
    
    // Handle relative dates
    if (command.includes('today')) {
      result.date = format(new Date(), 'yyyy-MM-dd');
    } else if (command.includes('tomorrow')) {
      result.date = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    } else if (command.includes('next week')) {
      result.date = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    }
    
    // Handle specific days
    const dayMatch = command.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(dayMatch[1].toLowerCase());
      const today = new Date().getDay();
      const daysUntil = targetDay >= today ? targetDay - today : 7 - today + targetDay;
      result.date = format(addDays(new Date(), daysUntil), 'yyyy-MM-dd');
    }
    
    // Handle time
    const timeMatch = command.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] || '00';
      const meridiem = timeMatch[3].toLowerCase();
      
      if (meridiem === 'pm' && hours !== 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      result.time = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return result;
  };

  const findProject = (name: string) => {
    return projects.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(p.name.toLowerCase())
    );
  };

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    
    try {
      // Greetings
      if (/^(hi|hey|hello|good morning|good afternoon|good evening)/.test(lowerCommand)) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        respondWithSuccess(`${greeting}! I'm ready to help you manage your tasks. What would you like to do?`);
        return;
      }

      // Status queries
      if (lowerCommand.includes('what') && (lowerCommand.includes('agenda') || lowerCommand.includes('today') || lowerCommand.includes('schedule'))) {
        const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date)));
        if (todayTasks.length === 0) {
          respondWithSuccess("You have no tasks scheduled for today. Would you like to add some?");
        } else {
          const highPriority = todayTasks.filter(t => t.priority <= 2).length;
          let response = `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} scheduled for today`;
          if (highPriority > 0) {
            response += `, including ${highPriority} high priority item${highPriority > 1 ? 's' : ''}`;
          }
          response += '. Would you like details?';
          respondWithSuccess(response);
        }
        return;
      }

      // Task recommendations
      if (lowerCommand.includes('what should i') || lowerCommand.includes('what to work on') || lowerCommand.includes('recommend')) {
        const urgentTasks = tasks
          .filter(t => !t.completed && t.priority <= 2)
          .sort((a, b) => a.priority - b.priority);
        
        if (urgentTasks.length === 0) {
          respondWithSuccess("You're all caught up on urgent tasks! Great work. Would you like to see other tasks?");
        } else {
          const task = urgentTasks[0];
          respondWithSuccess(`I recommend working on "${task.title}" next. It's marked as high priority${task.due_date ? ' and due soon' : ''}. Shall I open it for you?`);
        }
        return;
      }

      // Show projects
      if (lowerCommand.includes('show') && lowerCommand.includes('project')) {
        if (projects.length === 0) {
          respondWithSuccess("You don't have any projects yet. Would you like to create one?");
        } else {
          const projectList = projects.map(p => p.name).join(', ');
          respondWithSuccess(`You have ${projects.length} project${projects.length > 1 ? 's' : ''}: ${projectList}`);
        }
        return;
      }

      // Create project
      if (lowerCommand.includes('create project') || lowerCommand.includes('new project')) {
        const match = command.match(/(?:create|new)\s+project\s+(.+)/i);
        if (!match || !match[1].trim()) {
          respondWithError('Please specify a project name. For example: "Create project Website Redesign"');
          return;
        }
        
        const projectName = match[1].trim();
        const response = await projectsApi.create({
          name: projectName,
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
        });

        if (response.success) {
          setContext({ ...context, lastProject: projectName });
          respondWithSuccess(`Project "${projectName}" created successfully! Would you like to add tasks to it?`);
          onProjectCreated?.();
        } else {
          throw new Error(response.error || 'Failed to create project');
        }
        return;
      }

      // Add task with full details
      if (lowerCommand.includes('add') || lowerCommand.includes('create task')) {
        let taskTitle = '';
        let projectId: number | undefined;
        const dateTime = parseDateTime(command);
        
        // Extract task title (everything between add/create and date/time keywords)
        const titleMatch = command.match(/(?:add|create task)\s+(.+?)(?:\s+(?:to|for|in|today|tomorrow|on|at|next).*)?$/i);
        if (titleMatch) {
          taskTitle = titleMatch[1].trim();
        }

        // Check for project reference
        const projectMatch = command.match(/(?:to|for|in)\s+(.+?)(?:\s+(?:today|tomorrow|on|at|next)|$)/i);
        if (projectMatch) {
          const projectName = projectMatch[1].trim();
          const project = findProject(projectName);
          if (project) {
            projectId = project.id;
            // Remove project reference from title
            taskTitle = taskTitle.replace(new RegExp(`(?:to|for|in)\\s+${projectName}`, 'i'), '').trim();
          }
        }

        if (!taskTitle) {
          respondWithError('Please specify a task name. For example: "Add task Buy groceries tomorrow at 3pm"');
          return;
        }

        const response = await tasksApi.create({
          title: taskTitle,
          project_id: projectId,
          due_date: dateTime.date || format(new Date(), 'yyyy-MM-dd'),
          due_time: dateTime.time,
        });

        if (response.success) {
          let successMsg = `Task "${taskTitle}" added`;
          if (projectId) {
            const project = projects.find(p => p.id === projectId);
            successMsg += ` to ${project?.name}`;
          }
          if (dateTime.date || dateTime.time) {
            successMsg += ' and scheduled';
          }
          successMsg += ' successfully!';
          
          setContext({ ...context, lastTask: taskTitle });
          respondWithSuccess(successMsg);
          onTaskCreated?.();
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
        return;
      }

      // Count tasks
      if (lowerCommand.includes('how many')) {
        const pending = tasks.filter(t => !t.completed).length;
        const completed = tasks.filter(t => t.completed).length;
        respondWithSuccess(`You have ${pending} pending task${pending !== 1 ? 's' : ''} and ${completed} completed task${completed !== 1 ? 's' : ''}.`);
        return;
      }

      // List tasks
      if (lowerCommand.includes('list') || lowerCommand.includes('show task')) {
        const pending = tasks.filter(t => !t.completed);
        if (pending.length === 0) {
          respondWithSuccess("You have no pending tasks. Great job staying organized!");
        } else {
          const taskList = pending.slice(0, 5).map(t => t.title).join(', ');
          respondWithSuccess(`Here are your tasks: ${taskList}${pending.length > 5 ? `, and ${pending.length - 5} more` : ''}`);
        }
        return;
      }

      // Thank you
      if (lowerCommand.includes('thank')) {
        respondWithSuccess("You're welcome! I'm always here to help. What else can I do for you?");
        return;
      }

      // Help
      if (lowerCommand.includes('help') || lowerCommand.includes('what can you do')) {
        respondWithSuccess("I can help you create tasks and projects, check your agenda, recommend what to work on, and much more. Try asking: What's on my agenda? Or: Add task buy groceries tomorrow at 3pm");
        return;
      }

      // Default: didn't understand
      respondWithError("I didn't quite catch that. Try saying things like: 'What's on my agenda today?' or 'Add task buy milk tomorrow'");
      
    } catch (error: any) {
      respondWithError(error.message || 'An error occurred');
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-text-muted p-4 rounded-app bg-surface dark:bg-gray-800">
        <Volume2 size={16} className="inline mr-2" />
        Voice assistant not supported in this browser. Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-primary">Data - Voice Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            title={voiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </Button>
        </div>
      </div>

      {/* Wake Word Status */}
      {isWakeWordActive && status === 'wake-listening' && (
        <div className="p-3 rounded-app bg-primary/10 dark:bg-primary/20 border border-primary/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <div className="text-sm font-medium text-primary">
              Listening for "Hey Data"...
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={isWakeWordActive ? 'success' : 'secondary'}
          size="lg"
          onClick={toggleWakeWord}
          className="flex-1"
          title={isWakeWordActive ? 'Disable wake word' : 'Enable wake word - say "Hey Data" to activate'}
        >
          <Sparkles size={18} className={isWakeWordActive ? 'animate-pulse' : ''} />
          <span className="ml-2 font-semibold">
            {isWakeWordActive ? 'Wake Word Active' : 'Enable "Hey Data"'}
          </span>
        </Button>

        <Button
          variant={isListening ? 'danger' : 'primary'}
          size="lg"
          onClick={toggleListening}
          className={cn(
            'flex-1 transition-all',
            isListening && 'animate-pulse'
          )}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="ml-2 font-semibold">
            {isListening ? 'Listening...' : 'Manual Mode'}
          </span>
        </Button>

        {(status === 'listening' || status === 'processing' || status === 'success' || status === 'error') && (
          <div className={cn(
            'px-3 py-2 rounded-app text-sm font-medium',
            status === 'listening' && 'bg-primary/10 text-primary',
            status === 'processing' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
            status === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            status === 'error' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          )}>
            {status === 'listening' && '🎤'}
            {status === 'processing' && '⚙️'}
            {status === 'success' && '✅'}
            {status === 'error' && '❌'}
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="p-4 rounded-app bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <div className="text-xs text-text-muted mb-1 font-medium">You said:</div>
          <div className="text-base font-medium text-primary">"{transcript}"</div>
        </div>
      )}

      {/* Response */}
      {message && (
        <div className={cn(
          'p-4 rounded-app border',
          status === 'success' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          status === 'error' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        )}>
          <div className="flex items-start gap-2">
            {isSpeaking && <Volume2 size={16} className="mt-0.5 animate-pulse" />}
            <div className="flex-1">
              <div className="text-xs font-medium text-text-muted mb-1">Data:</div>
              <div className={cn(
                'text-sm',
                status === 'success' && 'text-green-800 dark:text-green-200',
                status === 'error' && 'text-red-800 dark:text-red-200'
              )}>
                {message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Examples */}
      {status === 'idle' && !message && !isWakeWordActive && (
        <div className="p-4 rounded-app bg-surface dark:bg-gray-800 border border-border dark:border-gray-700">
          <div className="text-xs font-semibold text-text-muted mb-2">Try these methods:</div>
          <div className="space-y-2 text-xs text-text-muted">
            <div className="font-medium text-primary">Wake Word Mode:</div>
            <div className="ml-3">Click "Enable Hey Data" and say "Hey Data" to activate</div>
            <div className="font-medium text-primary mt-2">Manual Mode:</div>
            <div className="ml-3">Click "Manual Mode" and speak your command</div>
            <div className="font-medium text-primary mt-2">Example commands:</div>
            <div className="ml-3">"What's on my agenda today?"</div>
            <div className="ml-3">"Add task buy groceries tomorrow at 3pm"</div>
            <div className="ml-3">"Create project Website Redesign"</div>
          </div>
        </div>
      )}

      {status === 'idle' && !message && isWakeWordActive && (
        <div className="p-4 rounded-app bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <div className="text-sm font-semibold text-primary mb-2">👋 Wake word mode active!</div>
          <div className="space-y-1 text-xs text-text-muted">
            <div>Say <span className="font-semibold text-primary">"Hey Data"</span> followed by your command</div>
            <div className="mt-2 text-primary font-medium">Examples:</div>
            <div className="ml-3">"Hey Data, what's on my agenda?"</div>
            <div className="ml-3">"Hey Data, add task call mom at 3pm"</div>
          </div>
        </div>
      )}
    </div>
  );
}
