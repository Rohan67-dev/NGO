import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { axiosClient } from '@/api/axiosClient';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/contact', formData);
      if (res.data.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">GET IN TOUCH</span>
        <h1 className="text-3xl font-extrabold text-slate-900">Contact Aasha Foundation</h1>
        <p className="text-xs text-slate-500">Questions about products, artisan partnerships, or impact programs?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-6">
          <h3 className="text-lg font-bold">Contact Information</h3>
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Aasha Foundation Center, Sector 4, New Delhi - 110001, India</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>contact@aasha-impact.org</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>+91 98765 43210</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
              <p className="text-xs text-slate-500">Thank you for reaching out. Our NGO representative will reply shortly.</p>
              <button onClick={() => setSubmitted(false)} className="text-xs font-bold text-emerald-600 underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500" />
              </div>
              <button disabled={loading} type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
