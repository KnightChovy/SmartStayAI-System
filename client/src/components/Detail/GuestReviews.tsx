

interface Room {
  rating: string;
}

interface GuestReviewsProps {
  selectedRoom: Room;
}

export function GuestReviews({ selectedRoom }: GuestReviewsProps) {
  return (
    <section className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
      <h2 className="font-bold text-xl mb-6 text-on-surface">Guest Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Rating Summary */}
        <div className="md:col-span-4 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary flex items-center justify-center rounded-2xl text-white text-xl font-bold shadow-md">
              {selectedRoom.rating}
            </div>
            <div>
              <p className="font-bold text-lg text-on-surface">Exceptional</p>
              <p className="text-on-surface-variant text-xs font-semibold">Based on 124 reviews</p>
            </div>
          </div>
          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Cleanliness', score: '10.0', pct: 'w-[100%]' },
              { label: 'Comfort', score: '9.8', pct: 'w-[98%]' },
              { label: 'Staff', score: '9.7', pct: 'w-[97%]' },
              { label: 'Location', score: '9.9', pct: 'w-[99%]' },
            ].map((sub, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">{sub.label}</span>
                  <span className="text-on-surface">{sub.score}</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full bg-primary ${sub.pct}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Sample Reviews */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 shadow-2xs hover:shadow-xs transition-shadow duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-primary text-xs">EJ</div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Elena J.</h4>
                  <p className="text-[9px] text-outline font-bold uppercase tracking-wider">United Kingdom • Oct 2024</p>
                </div>
              </div>
              <span className="font-bold text-primary text-sm bg-white dark:bg-card px-2.5 py-0.5 rounded-full border border-outline-variant/10 shadow-2xs">10.0</span>
            </div>
            <p className="text-on-surface-variant italic leading-relaxed text-xs">
              "The AI concierge perfectly anticipated our dinner preferences. The view of the sunset from the penthouse is truly life-changing. An absolute editorial dream."
            </p>
          </div>
          <div className="bg-surface-container-low/40 p-5 rounded-2xl border border-outline-variant/10 shadow-2xs hover:shadow-xs transition-shadow duration-300">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary-fixed-dim flex items-center justify-center font-bold text-secondary text-xs">MK</div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Marcus K.</h4>
                  <p className="text-[9px] text-outline font-bold uppercase tracking-wider">Germany • Sep 2024</p>
                </div>
              </div>
              <span className="font-bold text-primary text-sm bg-white dark:bg-card px-2.5 py-0.5 rounded-full border border-outline-variant/10 shadow-2xs">9.6</span>
            </div>
            <p className="text-on-surface-variant italic leading-relaxed text-xs">
              "Impeccable design. The soundproofing is remarkable - you feel like the only person in the world while being steps away from the city center."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
