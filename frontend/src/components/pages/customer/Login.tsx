import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { useAuthStore } from '../../../store/useAuthStore';
import { PasswordInput } from '../../common/PasswordInput';
import { safeRedirect } from '../../../lib/format';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/login', { email: email.trim(), password });
      setAuth(res.data.data.user, res.data.data.token);
      navigate(redirect, { replace: true });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Invalid email or password'));
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
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign In to AASHA</h1>
          <p className="text-xs text-slate-500">Access your account, cart and order history.</p>
        </div>

        {/* Demo accounts exist only when the demo data seed is enabled (APP_SEED_DEMO_DATA=true). */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">Demo accounts (development data)</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => autoFillDemo('customer')} className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold py-1.5 rounded-xl transition-all">
              Customer Demo
            </button>
            <button type="button" onClick={() => autoFillDemo('admin')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-1.5 rounded-xl transition-all">
              Admin Demo
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          <div>
            <label htmlFor="login-email" className="form-label">Email Address</label>
            <div className="relative">
              <input
                id="login-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" aria-hidden="true" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="form-label">Password</label>
            <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="••••••••" />
          </div>

          <button disabled={loading} type="submit" className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2">
            <span>{loading ? 'Signing in…' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            Forgot your password? <Link to="/contact" className="underline">Contact us</Link> - self-service reset needs an email service, which is not configured yet.
          </p>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don&apos;t have an account?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-emerald-600 font-bold underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};
