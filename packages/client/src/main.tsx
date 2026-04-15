import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AppRouter />
    <Toaster richColors closeButton />
  </AuthProvider>
);
