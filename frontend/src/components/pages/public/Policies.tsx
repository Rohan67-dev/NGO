import React from 'react';
import { useParams } from 'react-router-dom';

export const Policies: React.FC = () => {
  const { type } = useParams<{ type: string }>();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 capitalize">
          {type ? `${type.replace('-', ' ')} Policy` : 'Organization Policies'}
        </h1>
        <div className="text-xs text-slate-600 leading-relaxed space-y-4">
          <p>
            Aasha Foundation operates under strict ethical non-profit guidelines. All transactions are processed through encrypted payment gateways (Razorpay).
          </p>
          <h3 className="text-sm font-bold text-slate-800">1. Fair Wage &amp; Transparency Guarantee</h3>
          <p>
            Every product in our marketplace is handcrafted by registered artisan groups receiving fair wages above regional statutory minimums.
          </p>
          <h3 className="text-sm font-bold text-slate-800">2. Shipping &amp; Delivery</h3>
          <p>
            Orders are dispatched within 2-4 business days. Standard delivery across India takes 3-7 business days depending on location.
          </p>
          <h3 className="text-sm font-bold text-slate-800">3. Returns &amp; Refunds</h3>
          <p>
            If a handcrafted item arrives damaged, please submit a return request within 7 days of delivery for a replacement or full refund.
          </p>
        </div>
      </div>
    </div>
  );
};
