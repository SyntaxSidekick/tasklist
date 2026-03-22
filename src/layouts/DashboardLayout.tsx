import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  FolderOpen,
  Bell,
  Settings,
  Menu,
  X,
  Plus,
  Sun,
  Moon,
  Timer,
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationsStore } from '@/store';
import { useNotifications } from '@/hooks/useNotifications';
import Button from '@/components/ui/Button';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationsStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  
  // Initialize notifications polling
  useNotifications();

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Upcoming', href: '/upcoming', icon: Calendar },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-surface dark:bg-dark">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
          
          {/* Mobile Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-300">
            <div className="flex flex-col h-full border-r border-border dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border dark:border-gray-800">
            <img src="/src/syntax-sidekick-logo.svg" alt="Syntax Sidekick" className="h-8" />
                <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                  <X size={20} />
                </Button>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={toggleSidebar}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-app text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-error text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
      
      {/* Desktop Sidebar - Always visible on md+ screens */}
      <aside className="hidden md:flex md:flex-shrink-0 w-64">
        <div className="flex flex-col w-64 border-r border-border dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border dark:border-gray-800">
            <img src="/src/syntax-sidekick-logo.svg" alt="Syntax Sidekick" className="h-8" />
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-app text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-surface dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-error text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full"
              >
                Logout
              </Button>
            </div>
          </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-border dark:border-gray-800 bg-white dark:bg-gray-900">
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="md:hidden">
            <Menu size={20} />
          </Button>
          
          <h2 className="hidden md:block text-lg font-semibold text-primary">Task List</h2>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPomodoro(!showPomodoro)}>
              <Timer size={20} />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </header>

        {/* Demo Mode Banner */}
        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="font-semibold text-primary">🚀 Demo Mode</span>
              <span className="text-text-muted">
                All data is stored locally in your browser. Try creating tasks, projects, and using the voice assistant!
              </span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex items-center justify-around h-16 border-t border-border dark:border-gray-800 bg-white dark:bg-gray-900 safe-area-bottom">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative',
                  isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <Icon size={24} />
                {item.badge ? (
                  <span className="absolute top-1 right-1/4 px-1.5 py-0.5 text-xs font-bold rounded-full bg-error text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-primary"
          >
            <Plus size={24} />
          </button>
        </nav>
      </div>

      {/* Floating Action Button (FAB) - Desktop */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover active:bg-primary-active transition-colors items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* Pomodoro Timer */}
      {showPomodoro && <PomodoroTimer onClose={() => setShowPomodoro(false)} />}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <TaskFormModal
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => {
            setShowQuickAdd(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
