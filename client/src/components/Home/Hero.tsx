import { useState } from 'react';
import { Button } from '../ui/button';

export default function Hero() {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('Add dates');
  const [guests, setGuests] = useState('Add guests');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Searching for: ${destination || 'Anywhere'} | Dates: ${dates} | Guests: ${guests}`
    );
  };

  return (
    <section className="relative pt-20 pb-24 px-margin-mobile overflow-hidden bg-gradient-to-b from-surface to-transparent w-full">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="font-be-vietnam text-display-lg md:text-6xl text-on-surface mb-6 font-bold leading-tight">
          Find your next stay
        </h1>
        <p className="font-be-vietnam text-lg text-on-surface-variant max-w-xl mx-auto">
          Experience curated sanctuaries powered by intelligent discovery.
        </p>
      </div>
      {/* Search Bar Area */}
      <div className="max-w-5xl mx-auto relative z-10">
        <form
          onSubmit={handleSearch}
          className="bg-white p-2 rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 border border-outline-variant/20"
        >
          <div className="w-full md:flex-[1.5] px-6 py-3 flex flex-col group">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Destination
            </label>
            <input
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm placeholder:text-outline/50 font-medium outline-none mt-1"
              placeholder="Where are you going?"
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30"></div>
          <div
            className="w-full md:flex-1 px-6 py-3 flex flex-col cursor-pointer"
            onClick={() => {
              const dateInput = prompt(
                'Enter dates (e.g., Jun 12 - Jun 15):',
                dates === 'Add dates' ? '' : dates
              );
              if (dateInput) setDates(dateInput);
            }}
          >
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Check-in / Out
            </label>
            <span className="text-left text-sm font-medium text-outline/50 mt-1 hover:text-on-surface transition-colors block">
              {dates}
            </span>
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30"></div>
          <div
            className="w-full md:flex-1 px-6 py-3 flex flex-col cursor-pointer"
            onClick={() => {
              const guestInput = prompt(
                'Enter number of guests (e.g., 2 guests, 1 room):',
                guests === 'Add guests' ? '' : guests
              );
              if (guestInput) setGuests(guestInput);
            }}
          >
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Guests
            </label>
            <span className="text-left text-sm font-medium text-outline/50 mt-1 hover:text-on-surface transition-colors block">
              {guests}
            </span>
          </div>
          <Button
            type="submit"
            className="w-full md:w-16 h-14 bg-on-surface text-white rounded-2xl md:rounded-full flex items-center justify-center hover:bg-primary transition-all shadow-lg cursor-pointer border-none"
          >
            <span className="material-symbols-outlined">search</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
