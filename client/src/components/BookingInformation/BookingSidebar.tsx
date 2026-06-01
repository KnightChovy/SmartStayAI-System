interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  roomName: string;
  pricePerNight: number;
  formatDisplayDate: (dateStr: string) => string;
}

export function BookingSidebar({
  checkIn,
  checkOut,
  nights,
  guests,
  roomName,
  pricePerNight,
  formatDisplayDate,
}: BookingSidebarProps) {
  const roomTotal = pricePerNight * nights;
  const originalTotal = Math.round(roomTotal / 0.9);

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 font-be-vietnam">
      {/* Hotel Snapshot Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="h-48 relative">
          <img
            alt="Executive Penthouse Suite"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7x6cMG9-zA1BYfDIFwFW7UceNIPuPPa_G9WcwRiPn4f2bLPrZwwMkb-lDIN3fNCRdVMOI1Pl7V5tHUqAqtZ0IQvwxjYvqHvtVjvNWAONuOZAs1mItheQL5AL_jspJlFl4eqJ5jWVN247yUEzZECTdINKiEDqfeI6Bt77fjtRssWX_qXGBnYjtxCpUYq183wo4ZuZzooZF1S5bys9g54SDP3DfdWJvRlXC1gTCDYOwYH7fgwWmYbeFnQmZ1XA-qk7LC02qWMsLtIHX"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-premium-gold text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
          <h2 className="font-bold text-lg text-on-surface mb-1">
            Smart Stay AI
          </h2>
          <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-primary">
              location_on
            </span>
            123 Coastal Ave, Malibu
          </p>
        </div>
      </div>

      {/* Booking Details Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm p-5">
        <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4 border-b border-outline-variant/10 pb-2">
          Booking Details
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">
              Check-in
            </p>
            <p className="text-sm font-bold text-on-surface">
              {formatDisplayDate(checkIn)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-outline font-bold uppercase tracking-wider mb-1">
              Check-out
            </p>
            <p className="text-sm font-bold text-on-surface">
              {formatDisplayDate(checkOut)}
            </p>
          </div>
        </div>
        <div className="space-y-2 border-t border-outline-variant/5 pt-3">
          <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">
              calendar_today
            </span>
            <span>
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </p>
          <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">
              meeting_room
            </span>
            <span>1 room, {guests}</span>
          </p>
          <div className="bg-surface-container-low p-3.5 rounded-xl mt-4 border border-outline-variant/10">
            <p className="text-[9px] text-outline font-bold uppercase tracking-wider mb-1">
              Room Type
            </p>
            <p className="text-xs font-bold text-on-surface leading-tight">
              {roomName}
            </p>
          </div>
        </div>
      </div>

      {/* Price Summary Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/25 shadow-md p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Total Price
          </span>
          <div className="text-right">
            <p className="text-on-surface-variant line-through text-xs font-medium mb-0.5">
              ${originalTotal}
            </p>
            <div className="gold-badge px-2 py-0.5 rounded text-[8px] font-bold text-on-tertiary-fixed-variant uppercase tracking-wider inline-block mb-1 shadow-2xs">
              10% OFF MEMBER DEAL
            </div>
            <p className="text-2xl font-bold text-secondary">${roomTotal}</p>
          </div>
        </div>
        <p className="text-[10px] font-semibold text-on-surface-variant text-center border-t border-outline-variant/10 pt-4 mt-2">
          Includes taxes and charges
        </p>
      </div>
    </aside>
  );
}
