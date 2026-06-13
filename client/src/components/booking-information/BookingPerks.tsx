export function BookingPerks() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm p-6 md:p-8 space-y-4 font-be-vietnam">
      <h2 className="font-bold text-xl text-on-surface">
        Executive Penthouse Suite
      </h2>
      <p className="text-xs font-semibold text-on-surface-variant">
        Included in your stay:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
        {[
          'Free cancellation before Oct 20',
          'Breakfast included',
          '8K Smart TV with AI concierge',
          'Private terrace access',
        ].map((perk, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-green-600 text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              {perk}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
