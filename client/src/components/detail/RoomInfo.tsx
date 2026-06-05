import { Button } from '../ui/button';
import type { RoomInfoProps } from '@/types/detail.types';

export function RoomInfo({
  selectedRoom,
  isExpanded,
  setIsExpanded,
}: RoomInfoProps) {
  return (
    <div className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
      {/* Section B: Room Header & Meta */}
      <section className="mb-8">
        <span className="bg-secondary-container/20 text-secondary font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 inline-block">
          Exclusive Sanctuary
        </span>
        <h1 className="font-bold text-3xl md:text-4xl text-on-surface mb-6 tracking-tight">
          {selectedRoom.name}
        </h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container-low rounded-2xl text-on-surface-variant text-sm font-semibold border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg text-primary">
              groups
            </span>
            <span>{selectedRoom.capacity}</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container-low rounded-2xl text-on-surface-variant text-sm font-semibold border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg text-primary">
              square_foot
            </span>
            <span>{selectedRoom.size}</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container-low rounded-2xl text-on-surface-variant text-sm font-semibold border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg text-primary">
              king_bed
            </span>
            <span>{selectedRoom.bed}</span>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container-low rounded-2xl text-on-surface-variant text-sm font-semibold border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg text-primary">
              beach_access
            </span>
            <span>{selectedRoom.view}</span>
          </div>
        </div>
      </section>

      <hr className="border-outline-variant/20 my-8" />

      {/* Section C: Room Description */}
      <section className="mb-8">
        <h2 className="font-bold text-xl mb-4 text-on-surface">
          Experience Refined Comfort
        </h2>
        <div className="text-on-surface-variant leading-relaxed text-sm space-y-4">
          <p>
            Ascend to the pinnacle of coastal luxury in our Executive Penthouse
            Suite. Designed for the discerning traveler, this expansive
            residence blends architectural precision with an editorial
            aesthetic. Every detail—from the bespoke walnut cabinetry to the
            curated art pieces—reflects our commitment to 'Quiet Luxury'. Enjoy
            panoramic views of the ocean from your private terrace, or unwind in
            the integrated smart living area powered by our proprietary AI
            concierge.
          </p>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-125 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
          >
            <p className="border-t border-outline-variant/10 pt-4 text-on-surface-variant leading-relaxed">
              The suite features a sound-isolated master wing, a walk-in
              dressing room, and a spa-inspired bath finished in Italian
              Calacatta marble. Advanced climate control and bio-adaptive
              lighting ensure your environment evolves with your circadian
              rhythm, providing an unparalleled restorative experience.
            </p>
          </div>
          <Button
            variant="link"
            className="mt-2 text-primary font-bold hover:underline flex items-center gap-1 uppercase tracking-widest text-[11px] p-0 h-auto cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Read less' : 'Read more'}
            <span className="material-symbols-outlined text-sm font-semibold transition-transform duration-300">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </Button>
        </div>
      </section>

      <hr className="border-outline-variant/20 my-8" />

      {/* Section D: Room Amenities */}
      <section className="mb-4">
        <h2 className="font-bold text-xl mb-6 text-on-surface">
          Amenities & Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { icon: 'wifi', name: 'High-Speed WiFi' },
            { icon: 'ac_unit', name: 'Climate Control' },
            { icon: 'smart_display', name: '8K Smart TV' },
            { icon: 'liquor', name: 'Premium Minibar' },
            { icon: 'coffee_maker', name: 'Nespresso Vertuo' },
            { icon: 'local_laundry_service', name: 'In-Suite Laundry' },
          ].map((amenity, index) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-premium-gold text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {amenity.icon}
                </span>
                <span className="text-sm font-semibold text-on-surface-variant">
                  {amenity.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
