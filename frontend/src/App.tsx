import React, { useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { useWishlistStore } from './store/useWishlistStore';
import { axiosClient } from './api/axiosClient';
import { Toaster } from './components/common/Toaster';
import { ScrollToTop } from './components/common/ScrollToTop';

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

  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    const loggedOut = wasAuthenticated.current && !isAuthenticated;
    wasAuthenticated.current = isAuthenticated;
    if (!isAuthenticated) {
      // On logout only: drop the previous user's cached private data (orders, admin lists).
      // resetQueries (not clear) so queries on the current page refetch instead of being orphaned.
      if (loggedOut) queryClient.resetQueries();
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
        <ScrollToTop />
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
