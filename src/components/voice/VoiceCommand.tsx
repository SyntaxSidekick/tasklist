import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { tasksApi, projectsApi } from '@/lib/api';
import { useProjectsStore } from '@/store';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface VoiceCommandProps {
  onTaskCreated?: () => void;
  onProjectCreated?: () => void;
}

export default function VoiceCommand({ onTaskCreated, onProjectCreated }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const { projects } = useProjectsStore();

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('listening');
      setMessage('Listening...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setStatus('processing');
      processCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('error');
      setMessage(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    
    try {
      // Command: "create project [name]"
      if (lowerCommand.startsWith('create project')) {
        const projectName = command.substring('create project'.length).trim();
        if (!projectName) {
          throw new Error('Please specify a project name');
        }
        
        const response = await projectsApi.create({
          name: projectName,
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
        });

        if (response.success) {
          setStatus('success');
          setMessage(`Project "${projectName}" created successfully!`);
          onProjectCreated?.();
        } else {
          throw new Error(response.error || 'Failed to create project');
        }
      }
      // Command: "add to [project] [task]" or "add task to [project] [task]"
      else if (lowerCommand.includes('add to') || lowerCommand.includes('add task to')) {
        const match = lowerCommand.match(/add(?:\s+task)?\s+to\s+(.+?)\s+(.+)/);
        if (!match) {
          throw new Error('Please use format: "add to [project name] [task name]"');
        }

        const projectName = match[1].trim();
        const taskTitle = match[2].trim();

        // Find project by name (case-insensitive)
        const project = projects.find(p => 
          p.name.toLowerCase() === projectName.toLowerCase()
        );

        if (!project) {
          throw new Error(`Project "${projectName}" not found. Please create it first.`);
        }

        const response = await tasksApi.create({
          title: taskTitle,
          project_id: project.id,
        });

        if (response.success) {
          setStatus('success');
          setMessage(`Task "${taskTitle}" added to "${project.name}"!`);
          onTaskCreated?.();
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
      }
      // Command: "add task [title]" or "create task [title]"
      else if (lowerCommand.startsWith('add task') || lowerCommand.startsWith('create task')) {
        const prefix = lowerCommand.startsWith('add task') ? 'add task' : 'create task';
        const taskTitle = command.substring(prefix.length).trim();
        
        if (!taskTitle) {
          throw new Error('Please specify a task name');
        }

        const response = await tasksApi.create({
          title: taskTitle,
          due_date: new Date().toISOString().split('T')[0], // Today
        });

        if (response.success) {
          setStatus('success');
          setMessage(`Task "${taskTitle}" created!`);
          onTaskCreated?.();
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
      }
      else {
        throw new Error('Command not recognized. Try:\n- "create project [name]"\n- "add to [project] [task]"\n- "add task [title]"');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An error occurred');
    }

    // Reset after 5 seconds
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
      setTranscript('');
    }, 5000);
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-text-muted">
        <Volume2 size={16} className="inline mr-1" />
        Voice commands not supported in this browser
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant={isListening ? 'danger' : 'primary'}
          size="sm"
          onClick={toggleListening}
          className={cn(
            'transition-all',
            isListening && 'animate-pulse'
          )}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span className="ml-2">
            {isListening ? 'Stop' : 'Voice Command'}
          </span>
        </Button>

        {status !== 'idle' && (
          <div className={cn(
            'text-sm font-medium',
            status === 'listening' && 'text-primary',
            status === 'processing' && 'text-yellow-600 dark:text-yellow-500',
            status === 'success' && 'text-green-600 dark:text-green-500',
            status === 'error' && 'text-error'
          )}>
            {status === 'listening' && '🎤 Listening...'}
            {status === 'processing' && '⚙️ Processing...'}
            {status === 'success' && '✅ Success!'}
            {status === 'error' && '❌ Error'}
          </div>
        )}
      </div>

      {transcript && (
        <div className="text-sm p-3 rounded-app bg-surface dark:bg-gray-800 border border-border dark:border-gray-700">
          <div className="text-xs text-text-muted mb-1">You said:</div>
          <div className="font-medium">"{transcript}"</div>
        </div>
      )}

      {message && (
        <div className={cn(
          'text-sm p-3 rounded-app border',
          status === 'success' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
          status === 'error' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        )}>
          {message}
        </div>
      )}

      {status === 'idle' && (
        <div className="text-xs text-text-muted space-y-1">
          <div className="font-medium">Try these commands:</div>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>"create project [project name]"</li>
            <li>"add to [project name] [task name]"</li>
            <li>"add task [task name]"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
