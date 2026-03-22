import type { Task } from '@/types';
import Modal from '@/components/ui/Modal';
import TaskForm from './TaskForm';

interface TaskFormModalProps {
  task?: Task;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: number;
}

export default function TaskFormModal({
  task,
  onClose,
  onSuccess,
  defaultProjectId,
}: TaskFormModalProps) {
  const handleSubmit = () => {
    onSuccess();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      size="md"
    >
      <TaskForm
        task={task}
        onSubmit={handleSubmit}
        onCancel={onClose}
        defaultProjectId={defaultProjectId}
      />
    </Modal>
  );
}
