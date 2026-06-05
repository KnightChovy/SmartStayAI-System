export function PropertyFacilities() {
  return (
    <section className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
      <h2 className="font-bold text-xl mb-6 text-on-surface">
        Property Facilities
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {[
          {
            icon: 'restaurant',
            title: 'Food & Drink',
            items: [
              'On-site Fine Dining Restaurant',
              'Champagne Lounge',
              'In-room Breakfast Service',
            ],
          },
          {
            icon: 'spa',
            title: 'Wellness',
            items: [
              'Rooftop Infinity Pool',
              'Full-service Spa & Sauna',
              '24/7 Technogym Fitness Center',
            ],
          },
          {
            icon: 'security',
            title: 'Security',
            items: [
              'Biometric Suite Entry',
              '24-hour Professional Security',
              'Safe Deposit Box',
            ],
          },
          {
            icon: 'concierge',
            title: 'Services',
            items: [
              'AI-Driven Personal Concierge',
              'Private Chauffeur Service',
              'Express Check-in/out',
            ],
          },
        ].map((category, idx) => (
          <div key={idx} className="space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {category.icon}
              </span>{' '}
              {category.title}
            </h4>
            <ul className="space-y-2 text-on-surface-variant font-semibold text-xs ml-7">
              {category.items.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant inline-block shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
