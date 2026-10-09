import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { axiosClient } from './api/axiosClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { isAuthenticated, setAuth } = useAuthStore();
  const { setCart } = useCartStore();

  useEffect(() => {
    // Verify token on mount if present
    if (isAuthenticated) {
      axiosClient.get('/auth/me')
        .then((res) => {
          if (res.data.success) {
            const token = localStorage.getItem('ngo_auth_token') || '';
            setAuth(res.data.data, token);
          }
        })
        .catch(() => {
          // Keep current stored state unless explicitly invalid
        });

      axiosClient.get('/cart')
        .then((res) => {
          if (res.data.success) {
            setCart(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
