import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register({ email, password, name });
      if (response.success && response.data) {
        setUser(response.data.user);
        navigate('/home');
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/src/syntax-sidekick-logo.svg" alt="Syntax Sidekick" className="h-16 mx-auto mb-4" />
          <p className="text-text-muted">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-app-lg shadow-xl p-8 border border-border dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-app bg-error/10 text-error text-sm">
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />

            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
