import { Button } from '../ui/button';

interface Room {
  name: string;
  price: number;
  inHighDemand: boolean;
  roomsLeft: number;
}

interface BookingCardProps {
  selectedRoom: Room;
  checkIn: string;
  setCheckIn: (val: string) => void;
  checkOut: string;
  setCheckOut: (val: string) => void;
  guests: string;
  setGuests: (val: string) => void;
  nights: number;
  roomTotal: number;
  totalConciergeFee: number;
  grandTotal: number;
  onReserve: () => void;
}

export function BookingCard({
  selectedRoom,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  nights,
  roomTotal,
  totalConciergeFee,
  grandTotal,
  onReserve,
}: BookingCardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-3xl border border-outline-variant/20 shadow-lg overflow-hidden">
      {/* Urgency Banner */}
      {selectedRoom.inHighDemand && (
        <div className="bg-error-container/20 px-6 py-3.5 flex items-center gap-3 border-b border-error-container/10">
          <span
            className="material-symbols-outlined text-error text-xl shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            error
          </span>
          <p className="text-xs font-bold text-on-error-container tracking-wide animate-pulse">
            In high demand! Only {selectedRoom.roomsLeft} rooms left!
          </p>
        </div>
      )}
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-4xl text-on-surface">
            ${selectedRoom.price}
          </span>
          <span className="text-sm font-semibold text-on-surface-variant">
            / night
          </span>
        </div>
        <p className="text-[10px] text-outline font-bold uppercase tracking-widest border-b border-outline-variant/10 pb-4">
          + Taxes & fees calculated at booking
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
              Check-in
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
              Check-out
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
              Guests
            </label>
            <select
              value={guests}
              onChange={e => setGuests(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl p-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
            >
              <option>2 Adults, 0 Children</option>
              <option>2 Adults, 1 Child</option>
              <option>4 Adults, 0 Children</option>
            </select>
          </div>
        </div>

        <Button
          className="w-full bg-primary text-white py-4 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-on-surface transition-all active:scale-[0.98] cursor-pointer shadow-md hover:shadow-lg h-12"
          onClick={onReserve}
        >
          Reserve Now
        </Button>
        <p className="text-center text-[10px] font-bold text-on-surface-variant/70 tracking-wide uppercase">
          You won't be charged yet
        </p>

        <div className="pt-4 border-t border-outline-variant/20 space-y-3 text-sm">
          <div className="flex justify-between font-semibold text-on-surface-variant">
            <span className="underline decoration-dotted decoration-outline-variant">
              Total for {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-on-surface font-bold">${roomTotal}</span>
          </div>
          <div className="flex justify-between font-semibold text-on-surface-variant">
            <span className="underline decoration-dotted decoration-outline-variant">
              Concierge Service Fee
            </span>
            <span className="text-on-surface font-bold">
              ${totalConciergeFee}
            </span>
          </div>
          <hr className="border-outline-variant/10 my-2" />
          <div className="flex justify-between text-base font-bold text-on-surface">
            <span>Grand Total</span>
            <span className="text-xl text-primary font-bold">
              ${grandTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
