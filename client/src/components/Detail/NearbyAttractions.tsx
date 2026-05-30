

export function NearbyAttractions() {
  return (
    <section className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
      <h2 className="font-bold text-xl mb-6 text-on-surface">What's Nearby</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-5">
          {[
            { icon: 'park', title: 'City Park', detail: '350m • 4 min walk' },
            { icon: 'theater_comedy', title: 'Opera House', detail: '1.2km • 15 min walk' },
            { icon: 'restaurant', title: "L'Artiste French Bistro", detail: '150m • 2 min walk' },
          ].map((place, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">{place.icon}</span>
              <div>
                <p className="font-bold text-sm text-on-surface">{place.title}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{place.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {[
            { icon: 'train', title: 'Central Metro Station', detail: '500m • 6 min walk' },
            { icon: 'museum', title: 'Modern Art Gallery', detail: '800m • 10 min walk' },
            { icon: 'shopping_bag', title: 'The Avenue Luxury Mall', detail: '1.5km • 5 min drive' },
          ].map((place, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">{place.icon}</span>
              <div>
                <p className="font-bold text-sm text-on-surface">{place.title}</p>
                <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{place.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
