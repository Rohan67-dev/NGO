import { AxiosError, AxiosHeaders } from 'axios';
import { useAuthStore } from './useAuthStore';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';
import { getErrorMessage, TOKEN_KEY } from '../api/axiosClient';
import { Cart, Product, User } from '../types';

const user: User = {
  id: 1, firstName: 'Asha', lastName: 'P', email: 'a@x.org', role: 'CUSTOMER', active: true, createdAt: '2026-01-01',
};
const product = { id: 7, name: 'Warli Coaster' } as Product;

describe('auth / cart / wishlist stores', () => {
  it('logout clears the previous user\'s cart and wishlist', () => {
    useAuthStore.getState().setAuth(user, 'token-123');
    useCartStore.getState().setCart({ id: 1, totalItems: 2, items: [] } as unknown as Cart);
    useWishlistStore.getState().add(product);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-123');

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(useCartStore.getState().cart).toBeNull();
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  it('only treats staff roles as admin', () => {
    useAuthStore.getState().setAuth({ ...user, role: 'STAFF' }, 't');
    expect(useAuthStore.getState().isAdmin).toBe(true);
    useAuthStore.getState().setUser({ ...user, role: 'CUSTOMER' });
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });

  it('wishlist add is idempotent and remove works', () => {
    const w = useWishlistStore.getState();
    w.clear();
    w.add(product);
    w.add(product);
    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useWishlistStore.getState().isInWishlist(7)).toBe(true);
    useWishlistStore.getState().remove(7);
    expect(useWishlistStore.getState().isInWishlist(7)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  const axiosErr = (status: number, data: unknown) =>
    new AxiosError('fail', 'ERR', undefined, undefined, {
      status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() },
    });

  it('prefers the server message and validation details', () => {
    expect(getErrorMessage(axiosErr(400, { message: 'Only 2 left' }))).toBe('Only 2 left');
    expect(getErrorMessage(axiosErr(400, { message: 'Validation failed', errors: ['phone: Phone number is invalid'] })))
      .toBe('Validation failed: phone: Phone number is invalid');
  });

  it('explains network failures', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toMatch(/Cannot reach the server/);
  });
});
