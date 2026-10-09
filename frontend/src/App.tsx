import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { useWishlistStore } from './store/useWishlistStore';
import { axiosClient } from './api/axiosClient';
import { Toaster } from './components/common/Toaster';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { isAuthenticated, setUser } = useAuthStore();
  const { setCart } = useCartStore();
  const { setWishlist } = useWishlistStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // Drop any cached private data (orders, admin lists) from the previous session.
      queryClient.clear();
      return;
    }
    // Refresh the stored profile; a 401 here logs the user out via the axios interceptor.
    axiosClient.get('/auth/me').then((res) => setUser(res.data.data)).catch(() => {});
    axiosClient.get('/cart').then((res) => setCart(res.data.data)).catch(() => {});
    axiosClient.get('/wishlist').then((res) => setWishlist(res.data.data)).catch(() => {});
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
