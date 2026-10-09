import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { useAuthStore } from '../../../store/useAuthStore';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        navigate(redirect);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const autoFillDemo = (type: 'customer' | 'admin') => {
    if (type === 'customer') {
      setEmail('customer@ngo.org');
      setPassword('customer123');
    } else {
      setEmail('admin@ngo.org');
      setPassword('admin123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign In to AASHA</h1>
          <p className="text-xs text-slate-500">Access your impact marketplace account &amp; order history.</p>
        </div>

        {/* Demo Quick Buttons */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">Quick Demo Login</span>
          <div className="flex gap-2">
            <button
              onClick={() => autoFillDemo('customer')}
              className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold py-1.5 rounded-xl transition-all shadow-2xs"
            >
              Customer Demo
            </button>
            <button
              onClick={() => autoFillDemo('admin')}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 rounded-xl transition-all shadow-2xs"
            >
              Admin Demo
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@ngo.org"
                className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to={`/register?redirect=${redirect}`} className="text-emerald-600 font-bold underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
