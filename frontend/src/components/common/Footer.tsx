import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteInfo } from '../../hooks/useSiteInfo';

export const Footer: React.FC = () => {
  const { data: site } = useSiteInfo();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>AASHA FOUNDATION</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Handmade products from artisan communities, sold to support the NGO&apos;s community programmes.
          </p>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-emerald-400" aria-hidden="true" />
            Shop with purpose
          </div>
        </div>

        <div>
          <h2 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Shop &amp; Impact</h2>
          <ul className="space-y-2 text-xs">
            <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">All Products</Link></li>
            <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">Impact Metrics</Link></li>
            <li><Link to="/campaigns" className="hover:text-emerald-400 transition-colors">Active Campaigns</Link></li>
            <li><Link to="/stories" className="hover:text-emerald-400 transition-colors">Beneficiary Stories</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Organization</h2>
          <ul className="space-y-2 text-xs">
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Mission</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            <li><Link to="/policies/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/policies/terms" className="hover:text-emerald-400 transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link to="/policies/shipping" className="hover:text-emerald-400 transition-colors">Shipping &amp; Refund Policy</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">NGO Contact</h2>
          {site?.address && (
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{site.address}</span>
            </div>
          )}
          {site?.email && (
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400">
              <Mail className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{site.email}</span>
            </a>
          )}
          {site?.phone && (
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400">
              <Phone className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{site.phone}</span>
            </a>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} {site?.name || 'Aasha Foundation for Social Impact'}. All rights reserved.</p>
        <span>Payments processed by Razorpay</span>
      </div>
    </footer>
  );
};
