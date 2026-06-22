import { useState } from 'react';
import InfoPageHeader from '../../components/shared/InfoPageHeader';

const categories = [
  {
    icon: 'travel_explore',
    title: 'Booking & Reservations',
    desc: 'Find rooms, modify dates, and manage your upcoming stays.',
  },
  {
    icon: 'payments',
    title: 'Payments & Refunds',
    desc: 'Payment methods, invoices, VNPay and refund timelines.',
  },
  {
    icon: 'login',
    title: 'Account & Login',
    desc: 'Password resets, profile settings, and loyalty membership.',
  },
  {
    icon: 'support_agent',
    title: 'During Your Stay',
    desc: 'Check-in, concierge requests, and on-site assistance.',
  },
];

const faqs = [
  {
    q: 'How do I modify or cancel my booking?',
    a: 'Open My Bookings from your account menu, select the reservation, and choose Modify or Cancel. Eligibility depends on the rate you booked — see Cancellation Options for details.',
  },
  {
    q: 'When will I receive my refund?',
    a: 'Approved refunds are returned to your original payment method within 5–10 business days, depending on your bank or VNPay processing times.',
  },
  {
    q: 'How does the AI concierge work?',
    a: 'Our AI concierge answers questions about a hotel, suggests rooms, and helps you book — available 24/7 from the chat bubble on every hotel page.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. Payments are processed through encrypted, PCI-compliant gateways. SmartStay never stores your full card number.',
  },
];

export default function HelpCenterPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="We're here to help"
        title="Help Center"
        description="Answers to the most common questions, plus ways to reach our team anytime."
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-14">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            search
          </span>
          <input
            type="search"
            placeholder="Search for a topic..."
            className="w-full h-14 pl-12 pr-4 rounded-full bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div
              key={cat.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {cat.icon}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {cat.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
              >
                <span className="font-semibold text-on-surface font-be-vietnam">
                  {faq.q}
                </span>
                <span
                  className={`material-symbols-outlined text-on-surface-variant transition-transform ${
                    open === i ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {open === i && (
                <p className="px-5 pb-5 text-sm text-on-surface-variant font-be-vietnam leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
