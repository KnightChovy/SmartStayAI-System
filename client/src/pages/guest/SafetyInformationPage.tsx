import InfoPageHeader from '../../components/shared/InfoPageHeader';

const pillars = [
  {
    icon: 'verified_user',
    title: 'Verified Properties',
    desc: 'Every hotel partner passes identity, licensing, and quality verification before going live.',
  },
  {
    icon: 'lock',
    title: 'Secure Payments',
    desc: 'Transactions run through encrypted, PCI-compliant gateways. We never store full card data.',
  },
  {
    icon: 'health_and_safety',
    title: 'Health Standards',
    desc: 'Partners commit to enhanced cleaning protocols and transparent on-site safety measures.',
  },
  {
    icon: 'support_agent',
    title: '24/7 Support',
    desc: 'Our team and AI concierge are reachable around the clock, before and during your stay.',
  },
];

const tips = [
  'Always communicate and pay through SmartStay — never wire money off-platform.',
  'Review the property’s safety amenities (smoke alarms, locks) on the hotel page.',
  'Keep a copy of your booking confirmation and emergency contacts handy.',
  'Report anything that feels off using the Report a Concern page — we act fast.',
];

export default function SafetyInformationPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="Your safety first"
        title="Safety Information"
        description="How SmartStay protects every guest — from booking to checkout."
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map(p => (
            <div
              key={p.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {p.icon}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <div className="rounded-3xl bg-surface-container-low/60 border border-outline-variant/30 p-8">
          <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
            Safety tips for travelers
          </h2>
          <ul className="space-y-4">
            {tips.map(tip => (
              <li key={tip} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-premium-gold text-xl shrink-0">
                  check_circle
                </span>
                <span className="text-on-surface-variant font-be-vietnam">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
