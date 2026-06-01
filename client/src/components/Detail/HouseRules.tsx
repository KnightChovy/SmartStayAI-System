

export function HouseRules() {
  return (
    <div className="space-y-8">
      {/* Section 5: House Rules Section */}
      <section className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
        <h2 className="font-bold text-xl mb-6 text-on-surface">House Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-4">
            <div className="flex justify-between border-b border-outline-variant/10 pb-3 text-xs font-semibold">
              <span className="text-on-surface-variant">Check-in</span>
              <span className="text-on-surface font-bold">From 15:00</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-3 text-xs font-semibold">
              <span className="text-on-surface-variant">Check-out</span>
              <span className="text-on-surface font-bold">Until 12:00</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-outline-variant/10 pb-3 text-xs font-semibold">
              <span className="text-on-surface-variant">Cancellation</span>
              <span className="text-on-surface font-bold text-right">Free up to 48h before</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant/10 pb-3 text-xs font-semibold">
              <span className="text-on-surface-variant">Age requirement</span>
              <span className="text-on-surface font-bold">Minimum 18 years</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Important Notes Section */}
      <section className="bg-red-500/5 p-5 rounded-3xl border border-red-500/10 flex gap-4 items-start">
        <span className="material-symbols-outlined text-error mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <div className="space-y-1 text-xs leading-relaxed font-semibold text-on-surface-variant">
          <p>
            Please note that all rooms are strictly non-smoking. Parties or large events are not permitted within the suites to ensure a restful environment for all guests. Pets are not permitted on the premises.
          </p>
        </div>
      </section>

      {/* Section 7: Frequently Asked Questions */}
      <section className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
        <h2 className="font-bold text-xl mb-6 text-on-surface">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Is breakfast included in the room rate?',
              a: 'Yes, a curated continental breakfast is included with the Executive Penthouse Suite, served either in our rooftop restaurant or directly in your suite.',
            },
            {
              q: 'Do you offer airport shuttles?',
              a: 'Complimentary private chauffeur transfers are available for all guests staying in our Penthouse suites. Please coordinate through your Smart Stay AI concierge.',
            },
            {
              q: 'Is there a swimming pool on site?',
              a: 'Our property features a stunning rooftop infinity pool with heated water and panoramic views of the coast, open from 6:00 AM to 10:00 PM.',
            },
          ].map((faq, i) => (
            <details key={i} className="group bg-surface-container-low/30 border border-outline-variant/10 rounded-2xl overflow-hidden transition-all duration-300">
              <summary className="p-4 cursor-pointer flex justify-between items-center hover:bg-surface-container-low/55 transition-colors font-bold text-sm text-on-surface select-none">
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-lg transition-transform duration-300 group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1 font-semibold text-on-surface-variant text-xs leading-relaxed border-t border-outline-variant/5">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
