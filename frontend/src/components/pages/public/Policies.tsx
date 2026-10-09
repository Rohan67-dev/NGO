import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSiteInfo } from '@/hooks/useSiteInfo';

/**
 * Policy pages linked from the footer. The original single page showed the same text for every policy
 * and asserted unverified facts (e.g. fair-wage certification). Each policy now has its own content,
 * describing how this platform actually works, and is marked as a draft for the NGO to confirm.
 */
const POLICIES: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'What we collect', body: 'Your name, email address, phone number and the delivery addresses you enter, your cart and wishlist, your orders, and any message you send through the contact form.' },
      { heading: 'Payments', body: 'Card, UPI and net-banking details are entered on Razorpay\'s checkout and are not stored on this website. We store only Razorpay\'s order and payment reference numbers.' },
      { heading: 'How we use it', body: 'To process and deliver your orders, to reply to your messages and to keep your account working. Passwords are stored only as secure one-way hashes.' },
      { heading: 'Your choices', body: 'You can update your name, phone number and saved addresses from your account page. Contact us to ask for a copy of your data or for its deletion.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: [
      { heading: 'Orders', body: 'An order is accepted once payment has been confirmed by our payment provider. Prices and taxes shown at checkout are calculated by our server and are final for that order.' },
      { heading: 'Handmade products', body: 'Products are handmade, so small variations in colour, size and finish from the photographs are normal and are not defects.' },
      { heading: 'Availability', body: 'Stock is limited. If an item sells out between checkout and payment, the order is cancelled and the full amount is refunded.' },
    ],
  },
  shipping: {
    title: 'Shipping & Refund Policy',
    sections: [
      { heading: 'Shipping charges', body: 'Shipping is free above the threshold shown in your cart; below it a flat shipping fee applies. Both are shown before you pay.' },
      { heading: 'Tracking', body: 'When your order is dispatched, the courier and tracking number appear on your account page.' },
      { heading: 'Cancellations', body: 'Unpaid orders can be cancelled from your account page. For paid orders, please contact us before the order is shipped.' },
      { heading: 'Damaged items & refunds', body: 'If an item arrives damaged, contact us with your order number and photographs. Approved refunds are returned to the original payment method.' },
    ],
  },
};

export const Policies: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const { data: site } = useSiteInfo();
  const policy = type ? POLICIES[type] : undefined;

  if (!policy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Policy not found</h1>
        <div className="flex justify-center gap-4 text-xs font-semibold text-emerald-700">
          {Object.entries(POLICIES).map(([key, p]) => (
            <Link key={key} to={`/policies/${key}`} className="underline">{p.title}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">{policy.title}</h1>
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Draft policy describing how this website works. It must be reviewed and confirmed by the NGO before launch.
        </p>
        <div className="text-xs text-slate-600 leading-relaxed space-y-4">
          {policy.sections.map((s) => (
            <section key={s.heading} className="space-y-1">
              <h2 className="text-sm font-bold text-slate-800">{s.heading}</h2>
              <p>{s.body}</p>
            </section>
          ))}
          <section className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800">Contact</h2>
            <p>
              Questions? <Link to="/contact" className="text-emerald-700 underline">Contact us</Link>
              {site?.email ? ` or email ${site.email}` : ''}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
