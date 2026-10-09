import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
  placeholder?: string;
}

/** Password field with a show/hide toggle. */
export const PasswordInput: React.FC<PasswordInputProps> = ({ id, value, onChange, autoComplete, minLength, placeholder }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        required
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full text-xs pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
      />
      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};
