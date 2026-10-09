import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { useAuthStore } from '../../../store/useAuthStore';
import { PasswordInput } from '../../common/PasswordInput';
import { safeRedirect } from '../../../lib/format';

export const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      setAuth(res.data.data.user, res.data.data.token);
      navigate(redirect, { replace: true });
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500">Join the AASHA Impact Community.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-first" className="form-label">First Name</label>
              <input id="reg-first" required autoComplete="given-name" maxLength={100} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="form-input" />
            </div>
            <div>
              <label htmlFor="reg-last" className="form-label">Last Name</label>
              <input id="reg-last" required autoComplete="family-name" maxLength={100} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="form-input" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input id="reg-email" required autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" />
          </div>

          <div>
            <label htmlFor="reg-phone" className="form-label">Phone Number (optional)</label>
            <input id="reg-phone" type="tel" autoComplete="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." className="form-input" />
          </div>

          <div>
            <label htmlFor="reg-password" className="form-label">Password (min. 6 characters)</label>
            <PasswordInput id="reg-password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
            <PasswordInput id="reg-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={6} />
          </div>

          <button disabled={loading} type="submit" className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2">
            <span>{loading ? 'Creating Account…' : 'Register'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-emerald-600 font-bold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
