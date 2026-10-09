import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User as UserIcon, Phone, ArrowRight } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { useAuthStore } from '../../../store/useAuthStore';

export const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      const res = await axiosClient.post('/auth/register', { firstName, lastName, email, phone, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        navigate(redirect);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500">Join the AASHA Impact Community.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
            <span>{loading ? 'Creating Account...' : 'Register'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to={`/login?redirect=${redirect}`} className="text-emerald-600 font-bold underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
