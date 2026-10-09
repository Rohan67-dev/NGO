import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User as UserIcon, LogOut, Menu, X, ShieldCheck, Search, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const cartItemCount = cart?.totalItems || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Banner Notice */}
      <div className="bg-emerald-800 text-emerald-50 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        <span>Every purchase directly funds artisan livelihoods & community initiatives.</span>
        <Link to="/impact" className="underline font-semibold hover:text-white ml-1">
          See Our Impact &rarr;
        </Link>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl tracking-tight group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-none font-black text-slate-900 text-lg group-hover:text-emerald-700 transition-colors">AASHA</span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-none">Impact Market</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-700">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-emerald-600 transition-colors">Shop Catalog</Link>
          <Link to="/impact" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Impact Portal
          </Link>
          <Link to="/campaigns" className="hover:text-emerald-600 transition-colors">Campaigns</Link>
          <Link to="/stories" className="hover:text-emerald-600 transition-colors">Stories</Link>
          <Link to="/about" className="hover:text-emerald-600 transition-colors">About NGO</Link>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-full outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
        </form>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Wishlist Link */}
          {isAuthenticated && (
            <Link to="/wishlist" className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors relative" title="Wishlist">
              <Heart className="w-5 h-5" />
            </Link>
          )}

          {/* Cart Trigger */}
          <button
            onClick={toggleCart}
            className="p-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* User Auth Controls */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all"
              >
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{user?.firstName}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">Home</Link>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">Shop Catalog</Link>
          <Link to="/impact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">Impact Portal</Link>
          <Link to="/campaigns" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">Campaigns</Link>
          <Link to="/stories" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">Stories</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-700 hover:text-emerald-600 py-1">About NGO</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-amber-600 py-1">Admin Dashboard</Link>
          )}
        </div>
      )}
    </header>
  );
};
