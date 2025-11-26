import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  // Initialize auth on app mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <AppRoutes />;
}

export default App;
