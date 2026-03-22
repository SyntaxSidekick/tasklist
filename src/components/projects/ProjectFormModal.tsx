import { useState } from 'react';
import { projectsApi } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ProjectFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const COLORS = [
  '#A7D08C', '#4A90E2', '#E05565', '#F4A623',
  '#9B59B6', '#1ABC9C', '#E74C3C', '#3498DB',
];

export default function ProjectFormModal({ onClose, onSuccess }: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#A7D08C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await projectsApi.create({ name, color });
      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || 'Failed to create project');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 rounded-app bg-error/10 text-error text-sm">
            {error}
          </div>
        )}

        <Input
          label="Project name"
          placeholder="My Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="grid grid-cols-8 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
