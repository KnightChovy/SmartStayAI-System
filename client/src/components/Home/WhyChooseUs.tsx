export default function WhyChooseUs() {
  const cards = [
    {
      icon: 'event_busy',
      title: 'Free Cancellation',
      desc: 'Flexible stays for peace of mind in changing times',
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      desc: 'Global assistance whenever you need a helping hand',
    },
    {
      icon: 'verified_user',
      title: 'Verified Reviews',
      desc: 'Authentic experiences only from real luxury travelers',
    },
    {
      icon: 'payments',
      title: 'Best Price',
      desc: 'Guaranteed exclusive rates for our intelligent members',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="text-center mb-12 mt-12">
        <h2 className="font-be-vietnam text-4xl font-bold text-on-surface">
          Why choose SmartStay?
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-8 rounded-3xl bg-white border border-outline-variant/20 flex flex-col items-center text-center premium-shadow hover:scale-102 transition-transform duration-300"
          >
            <span className="material-symbols-outlined text-primary mb-4 font-light text-4xl">
              {card.icon}
            </span>
            <h3 className="text-sm font-bold text-on-surface font-be-vietnam">
              {card.title}
            </h3>
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
