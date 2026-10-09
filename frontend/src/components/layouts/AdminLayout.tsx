import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FolderTree, ShoppingCart, Users, Sparkles, Megaphone, BookOpen, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: ShoppingBag },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
    { label: 'Impact Metrics', path: '/admin/impact', icon: Sparkles },
    { label: 'Stories CMS', path: '/admin/stories', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>AASHA ADMIN</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
          <Link to="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Storefront
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
};
