import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* NGO Brand & Mission */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>AASHA FOUNDATION</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Empowering rural artisans, marginal farmers, and underserved communities through sustainable commerce. Every purchase creates verified social impact.
          </p>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-emerald-400" />
            100% Transparent Non-Profit Operations
          </div>
        </div>

        {/* E-Commerce Links */}
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Shop & Impact</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">All Products</Link></li>
            <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">Impact Metrics</Link></li>
            <li><Link to="/campaigns" className="hover:text-emerald-400 transition-colors">Active Campaigns</Link></li>
            <li><Link to="/stories" className="hover:text-emerald-400 transition-colors">Beneficiary Stories</Link></li>
          </ul>
        </div>

        {/* NGO Information & Legal */}
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Organization</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Mission</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            <li><Link to="/policies/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/policies/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/policies/shipping" className="hover:text-emerald-400 transition-colors">Shipping & Refund Policy</Link></li>
          </ul>
        </div>

        {/* Contact & Transparency */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">NGO Contact</h4>
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Aasha Foundation Center, Sector 4, New Delhi - 110001</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>contact@aasha-impact.org</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>+91 98765 43210</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} Aasha Foundation for Social Impact. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <span className="text-emerald-500 font-medium">Verified NGO Partner</span>
          <span>&bull;</span>
          <span>Secured by Razorpay</span>
        </div>
      </div>
    </footer>
  );
};
