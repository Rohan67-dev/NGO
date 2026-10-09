import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ProductCard } from './shop/ProductCard';
import { CartDrawer } from './cart/CartDrawer';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { Shop } from './pages/public/Shop';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { axiosClient } from '../api/axiosClient';
import { Cart, Product, User } from '../types';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 1, name: 'Warli Painted Coaster', slug: 'warli-coaster', description: '', price: 500, discountPrice: 400,
  sku: 'W-1', stockQuantity: 3, categoryId: 1, categoryName: 'Warli', categorySlug: 'warli', status: 'ACTIVE',
  featured: false, imageUrls: [], createdAt: '2026-01-01', ...overrides,
});

const user: User = { id: 1, firstName: 'A', lastName: 'B', email: 'a@x.org', role: 'CUSTOMER', active: true, createdAt: '' };

const renderWithProviders = (ui: React.ReactNode, route = '/') => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProductCard', () => {
  it('shows the sale price and calls add-to-cart', async () => {
    const onAdd = vi.fn();
    renderWithProviders(<ProductCard product={product()} onAddToCart={onAdd} />);
    expect(screen.getByText('₹400')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toHaveClass('line-through');
    await userEvent.click(screen.getByRole('button', { name: /add warli painted coaster to cart/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('cannot be bought when out of stock', () => {
    renderWithProviders(<ProductCard product={product({ stockQuantity: 0, status: 'OUT_OF_STOCK' })} onAddToCart={vi.fn()} />);
    expect(screen.getByRole('button', { name: /sold out/i })).toBeDisabled();
  });
});

describe('ProtectedRoute', () => {
  it('sends guests to login with a redirect back', () => {
    useAuthStore.getState().logout();
    renderWithProviders(
      <Routes>
        <Route path="/checkout" element={<ProtectedRoute><p>secret</p></ProtectedRoute>} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>,
      '/checkout'
    );
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});

describe('CartDrawer', () => {
  it('shows server totals, charged unit price, and blocks checkout for unavailable items', () => {
    useAuthStore.getState().setAuth(user, 't');
    const cart: Cart = {
      id: 1, userId: 1, totalItems: 2, subtotal: 800, shippingAmount: 99, taxAmount: 40, taxRatePercent: 5,
      totalAmount: 939, freeShippingThreshold: 999, hasUnavailableItems: true,
      items: [{
        id: 10, productId: 1, productName: 'Warli Painted Coaster', productSlug: 'warli-coaster', price: 500, discountPrice: 400,
        unitPrice: 400, quantity: 2, stockQuantity: 1, available: false, itemTotal: 800,
      }],
    };
    useCartStore.setState({ cart, isOpen: true });
    renderWithProviders(<CartDrawer />);
    expect(screen.getByText('₹400.00')).toBeInTheDocument();
    expect(screen.getByText('₹939.00')).toBeInTheDocument();
    expect(screen.getByText(/only 1 left/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fix unavailable items/i })).toBeDisabled();
    act(() => useAuthStore.getState().logout());
  });
});

describe('Shop page', () => {
  it('searches using the URL query and shows the total count from the server', async () => {
    const get = vi.spyOn(axiosClient, 'get').mockImplementation(async (url: string) => {
      if (url === '/categories') return { data: { data: [] } };
      return { data: { data: { content: [product()], totalElements: 13, totalPages: 2, number: 0, size: 12 } } };
    });
    renderWithProviders(<Routes><Route path="/shop" element={<Shop />} /></Routes>, '/shop?query=warli');

    await waitFor(() => expect(screen.getByText(/13 products for “warli”/)).toBeInTheDocument());
    const productCall = get.mock.calls.find(([url]) => url === '/products');
    expect(productCall?.[1]).toMatchObject({ params: { query: 'warli', sortBy: 'createdAt', sortDir: 'desc', page: 0 } });
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    get.mockRestore();
  });
});
