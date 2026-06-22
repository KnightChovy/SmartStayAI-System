import InfoPageHeader from '../../components/shared/InfoPageHeader';

const stats = [
  { value: '500+', label: 'Verified properties' },
  { value: '120K', label: 'Happy guests' },
  { value: '15', label: 'Cities worldwide' },
  { value: '4.9', label: 'Average rating' },
];

const values = [
  {
    icon: 'auto_awesome',
    title: 'Intelligent by design',
    desc: 'AI guides every step — from discovery to concierge — so travel feels effortless.',
  },
  {
    icon: 'spa',
    title: 'Quiet luxury',
    desc: 'We curate calm, characterful stays over loud, generic ones.',
  },
  {
    icon: 'handshake',
    title: 'Partner-first',
    desc: 'We grow with our hotel partners through fair, transparent tools.',
  },
];

export default function AboutUsPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="Our story"
        title="About SmartStay AI"
        description="We're reimagining luxury travel through intelligent discovery and seamless, human-centered experiences."
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="rounded-3xl overflow-hidden shadow-md mb-10">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
            alt="A SmartStay partner hotel"
            className="w-full h-64 object-cover"
          />
        </div>
        <p className="text-on-surface-variant font-be-vietnam leading-relaxed mb-4">
          SmartStay AI was founded on a simple belief: finding the perfect place
          to stay should feel as restful as the stay itself. By combining curated
          taste with artificial intelligence, we match travelers to sanctuaries
          that resonate with how they want to feel.
        </p>
        <p className="text-on-surface-variant font-be-vietnam leading-relaxed">
          From an AI concierge that answers any question in seconds to smart
          alerts that keep your trip on track, every feature exists to remove
          friction — so you can focus on the experience.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(s => (
            <div
              key={s.label}
              className="text-center p-8 rounded-3xl bg-surface-container-low/60 border border-outline-variant/30"
            >
              <p className="text-3xl font-bold text-primary font-be-vietnam mb-1">
                {s.value}
              </p>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6 text-center">
          What we value
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map(v => (
            <div
              key={v.title}
              className="p-6 rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">
                  {v.icon}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam mb-2">
                {v.title}
              </h3>
              <p className="text-sm text-on-surface-variant font-be-vietnam">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
