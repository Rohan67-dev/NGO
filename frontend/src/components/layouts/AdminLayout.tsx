import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, ShoppingCart, Sparkles, Megaphone, BookOpen, ArrowLeft, Bell, Inbox, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Products', path: '/admin/products', icon: ShoppingBag },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
  { label: 'Impact Metrics', path: '/admin/impact', icon: Sparkles },
  { label: 'Stories CMS', path: '/admin/stories', icon: BookOpen },
  { label: 'Announcements', path: '/admin/announcements', icon: Bell },
  { label: 'Messages', path: '/admin/messages', icon: Inbox },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>AASHA ADMIN</span>
          </div>

          <nav className="space-y-1" aria-label="Admin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-bold text-slate-200">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-emerald-400 uppercase font-semibold">{user?.role}</p>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400">
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      {/* Top navigation (mobile) - the original layout had no admin navigation below the md breakpoint */}
      <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 font-bold text-sm">AASHA ADMIN</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Admin">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                location.pathname === item.path ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-y-auto p-4 sm:p-10 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
