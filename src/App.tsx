import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '@/store';
import { authApi } from '@/lib/api';

// Pages
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import DashboardLayout from '@/layouts/DashboardLayout';
import HomePage from '@/pages/Home';
import UpcomingPage from '@/pages/Upcoming';
import ProjectPage from '@/pages/Project';
import ProjectsPage from '@/pages/Projects';
import NotificationsPage from '@/pages/Notifications';
import SettingsPage from '@/pages/Settings';

function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await authApi.me();
        if (response.success && response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Auth check failed - user is not logged in or session expired
        // This is normal behavior, don't throw error
        console.log('Not authenticated');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();

    // Apply theme on mount
    setTheme(theme);
  }, []);

  // Show nothing while checking authentication
  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface dark:bg-dark">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<HomePage />} />
              <Route path="upcoming" element={<UpcomingPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
