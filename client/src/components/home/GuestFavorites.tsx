import { TestimonialsColumn } from '../blocks/testimonials-columns-1';
import type { Testimonial } from '../blocks/testimonials-columns-1';

const testimonials: Testimonial[] = [
  {
    text: 'The attention to detail at Zen Boutique Retreat was beyond anything I have experienced. Truly a sanctuary — I slept better than I have in months.',
    image:
      'https://randomuser.me/api/portraits/women/12.jpg',
    name: 'Sarah Johnson',
    role: 'Zen Boutique Retreat · London',
  },
  {
    text: 'Old world charm meets modern AI intelligence. The booking was seamless and the concierge anticipated every need before I even asked.',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'David Kim',
    role: 'Heritage Manor Suite · Tokyo',
    rating: 4,
  },
  {
    text: 'Waking up to the ocean view at the Phu Quoc villa was unreal. Spotless rooms, warm staff, and the sunset spa was the highlight of our trip.',
    image: 'https://randomuser.me/api/portraits/women/45.jpg',
    name: 'Emma Laurent',
    role: 'Azure Ocean Villa · Paris',
  },
  {
    text: 'Lantern-lit evenings in Hoi An felt like a dream. The suite blended heritage architecture with every modern comfort. We will be back.',
    image: 'https://randomuser.me/api/portraits/men/67.jpg',
    name: 'Liam Nguyen',
    role: 'Riverside Lantern House · Sydney',
  },
  {
    text: 'Cool mountain air, pine forests and a fireplace in the room — Da Lat was pure romance. SmartStay made the whole booking effortless.',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Mia Chen',
    role: 'Pinewood Highland Lodge · Singapore',
  },
  {
    text: 'The smart alerts kept us updated on everything from check-in to late dinner reservations. Five-star service from start to finish.',
    image: 'https://randomuser.me/api/portraits/men/14.jpg',
    name: 'Carlos Rivera',
    role: 'Grand Halong Cruise Suite · Madrid',
    rating: 4,
  },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

export default function GuestFavorites() {
  return (
    <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-section-gap w-full">
      <div className="flex flex-col items-center text-center mb-10">
        <span className="rounded-full border border-outline-variant/30 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary font-be-vietnam">
          Guest Reviews
        </span>
        <h2 className="font-be-vietnam text-2xl md:text-3xl font-bold text-on-surface mt-4">
          The guest's favorite accommodation
        </h2>
        <p className="text-on-surface-variant text-sm font-medium font-be-vietnam mt-2 max-w-lg">
          Real words from travelers who found their perfect stay with SmartStay AI.
        </p>
      </div>

      <div className="flex justify-center gap-6 mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-150 overflow-hidden">
        <TestimonialsColumn testimonials={firstColumn} duration={15} />
        <TestimonialsColumn
          testimonials={secondColumn}
          className="hidden md:block"
          duration={19}
        />
        <TestimonialsColumn
          testimonials={thirdColumn}
          className="hidden lg:block"
          duration={17}
        />
      </div>
    </section>
  );
}
