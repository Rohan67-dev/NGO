import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, User as UserIcon, LogOut, Menu, X, ShieldCheck, Search, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { axiosClient } from '../../api/axiosClient';
import { Announcement } from '../../types';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop Catalog' },
  { to: '/impact', label: 'Impact Portal' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/stories', label: 'Stories' },
  { to: '/about', label: 'About NGO' },
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => (await axiosClient.get('/announcements')).data.data,
    staleTime: 5 * 60 * 1000,
  });
  const banner = announcements?.[0];

  const cartItemCount = cart?.totalItems || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/shop?query=${encodeURIComponent(q)}` : '/shop');
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap hover:text-emerald-600 transition-colors ${isActive ? 'text-emerald-700 font-semibold' : ''}`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Announcement banner (managed in Admin > Announcements) */}
      {banner && (
        <div className="bg-emerald-800 text-emerald-50 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" aria-hidden="true" />
          <span>
            <strong>{banner.title}:</strong> {banner.content}
          </span>
          {banner.linkUrl &&
            (banner.linkUrl.startsWith('/') ? (
              <Link to={banner.linkUrl} className="underline font-semibold hover:text-white ml-1 whitespace-nowrap">
                Learn more &rarr;
              </Link>
            ) : (
              <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-white ml-1 whitespace-nowrap">
                Learn more &rarr;
              </a>
            ))}
        </div>
      )}

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" aria-label="Main">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl tracking-tight group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none font-black text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">AASHA</span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Impact Market</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-4 lg:space-x-6 text-sm font-medium text-slate-700">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs w-full" role="search">
          <label htmlFor="nav-search" className="sr-only">Search products</label>
          <input
            id="nav-search"
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-full outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" aria-hidden="true" />
        </form>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isAuthenticated && (
            <Link to="/wishlist" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors relative" aria-label={`Wishlist (${wishlistCount} items)`}>
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={toggleCart}
            className="p-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors relative"
            aria-label={`Shopping cart (${cartItemCount} items)`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center space-x-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>{user?.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all"
              >
                Sign In
              </Link>
              <Link to="/register" className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-all">
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative" role="search">
            <label htmlFor="mobile-search" className="sr-only">Search products</label>
            <input
              id="mobile-search"
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 border border-transparent focus:border-emerald-500 rounded-full outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          </form>
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">My Account &amp; Orders</Link>
                <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Wishlist</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-amber-600 py-1">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="block text-sm font-medium text-red-600 py-1">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 py-1">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-emerald-700 py-1">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
