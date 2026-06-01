import { Button } from '../ui/button';

interface Room {
  id: string;
  name: string;
  price: number;
  rating: string;
  details: string;
}

interface RoomAvailabilityProps {
  checkIn: string;
  setCheckIn: (val: string) => void;
  checkOut: string;
  setCheckOut: (val: string) => void;
  guests: string;
  setGuests: (val: string) => void;
  selectedRoomId: string;
  setSelectedRoomId: (val: string) => void;
  rooms: Record<string, Room>;
  formatDisplayDate: (dateStr: string) => string;
}

export function RoomAvailability({
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  selectedRoomId,
  setSelectedRoomId,
  rooms,
  formatDisplayDate,
}: RoomAvailabilityProps) {
  return (
    <section
      className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm"
      id="availability"
    >
      <h2 className="font-bold text-xl mb-6 text-on-surface">
        Available Rooms
      </h2>

      {/* Search Bar */}
      <div className="bg-surface-container-low p-5 rounded-2xl mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border border-outline-variant/10">
        <div className="space-y-1.5">
          <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
            Check-in Date
          </label>
          <input
            className="w-full bg-white dark:bg-card border border-outline-variant/35 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            type="date"
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
            Check-out Date
          </label>
          <input
            className="w-full bg-white dark:bg-card border border-outline-variant/35 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
            type="date"
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-outline font-bold uppercase px-1 tracking-wider">
            Guests
          </label>
          <select
            className="w-full bg-white dark:bg-card border border-outline-variant/35 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
            value={guests}
            onChange={e => setGuests(e.target.value)}
          >
            <option>2 Adults, 0 Children</option>
            <option>2 Adults, 1 Child</option>
            <option>4 Adults, 0 Children</option>
          </select>
        </div>
        <Button
          className="bg-primary text-white hover:bg-on-surface py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all h-11 cursor-pointer"
          onClick={() =>
            alert(
              `Searching for reservations from ${formatDisplayDate(checkIn)} to ${formatDisplayDate(checkOut)} for ${guests}...`
            )
          }
        >
          Search
        </Button>
      </div>

      {/* Room Types Grid */}
      <div className="space-y-4">
        {/* Superior Room */}
        <div
          className={`p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 border-2 cursor-pointer ${
            selectedRoomId === 'superior'
              ? 'bg-primary-container/20 border-primary shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50'
          }`}
          onClick={() => setSelectedRoomId('superior')}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="font-bold text-lg text-on-surface">
                Superior Double Room
              </h3>
              {selectedRoomId === 'superior' && (
                <span className="bg-secondary-container text-on-secondary-container text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Selected
                </span>
              )}
            </div>
            <p className="text-on-surface-variant text-xs font-semibold">
              {rooms.superior.details}
            </p>
          </div>
          <div className="flex items-center gap-6 self-end md:self-auto shrink-0 mt-3 md:mt-0">
            <div className="flex flex-col text-right">
              <span className="font-bold text-xl text-primary">
                ${rooms.superior.price}
              </span>
              <span className="text-[9px] text-outline font-bold uppercase tracking-wider">
                per night
              </span>
            </div>
            <Button
              className={`px-5 py-2 rounded-full text-2xs font-bold uppercase tracking-wider border-none cursor-pointer h-8 ${
                selectedRoomId === 'superior'
                  ? 'bg-primary text-white'
                  : 'bg-outline text-white hover:bg-primary'
              }`}
              onClick={e => {
                e.stopPropagation();
                setSelectedRoomId('superior');
              }}
            >
              {selectedRoomId === 'superior' ? 'Selected' : 'Reserve'}
            </Button>
          </div>
        </div>

        {/* Penthouse Suite */}
        <div
          className={`p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 border-2 cursor-pointer ${
            selectedRoomId === 'penthouse'
              ? 'bg-primary-container/20 border-primary shadow-sm'
              : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50'
          }`}
          onClick={() => setSelectedRoomId('penthouse')}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="font-bold text-lg text-on-surface">
                Executive Penthouse Suite
              </h3>
              {selectedRoomId === 'penthouse' && (
                <span className="bg-secondary-container text-on-secondary-container text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Selected
                </span>
              )}
            </div>
            <p className="text-on-surface-variant text-xs font-semibold">
              {rooms.penthouse.details}
            </p>
          </div>
          <div className="flex items-center gap-6 self-end md:self-auto shrink-0 mt-3 md:mt-0">
            <div className="flex flex-col text-right">
              <span className="font-bold text-xl text-primary">
                ${rooms.penthouse.price}
              </span>
              <span className="text-[9px] text-outline font-bold uppercase tracking-wider">
                per night
              </span>
            </div>
            <Button
              className={`px-5 py-2 rounded-full text-2xs font-bold uppercase tracking-wider border-none cursor-pointer h-8 ${
                selectedRoomId === 'penthouse'
                  ? 'bg-primary text-white'
                  : 'bg-outline text-white hover:bg-primary'
              }`}
              onClick={e => {
                e.stopPropagation();
                setSelectedRoomId('penthouse');
              }}
            >
              {selectedRoomId === 'penthouse' ? 'Selected' : 'Reserve'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
