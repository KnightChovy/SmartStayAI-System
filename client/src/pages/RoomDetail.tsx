import { useState } from 'react';
import { ImageGallery } from '../components/Detail/ImageGallery';
import { RoomInfo } from '../components/Detail/RoomInfo';
import { RoomAvailability } from '../components/Detail/RoomAvailability';
import { BookingCard } from '../components/Detail/BookingCard';
import { GuestReviews } from '../components/Detail/GuestReviews';
import { NearbyAttractions } from '../components/Detail/NearbyAttractions';
import { PropertyFacilities } from '../components/Detail/PropertyFacilities';
import { HouseRules } from '../components/Detail/HouseRules';
import { BookingConfirmation } from '../components/Detail/BookingConfirmation';

interface Room {
  id: string;
  name: string;
  price: number;
  rating: string;
  description: string;
  details: string;
  capacity: string;
  size: string;
  bed: string;
  view: string;
  inHighDemand: boolean;
  roomsLeft: number;
}

export default function RoomDetail() {
  // Description Read More State
  const [isExpanded, setIsExpanded] = useState(false);

  // Lightbox / Image Gallery Modal State
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);

  // Booking States
  const [checkIn, setCheckIn] = useState('2024-10-24');
  const [checkOut, setCheckOut] = useState('2024-10-27');
  const [guests, setGuests] = useState('2 Adults');
  const [selectedRoomId, setSelectedRoomId] = useState('penthouse');

  // Booking Success Modal State
  const [showConfirmation, setShowConfirmation] = useState(false);

  const images = [
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwMtOWhEp3eeYZIxSVV37Oz__GUndn6GAnr1V6ZMyOwHRP_d5A_Uu6-plGh9PArbas155KYC7XphRr__yM8IrrwMbBBLJbd86y0GvVf0Y1MFOhmsqVecjiPrdduaKtGFNrOMDGBIrOXZx6_6a70XSFq9W4-8lpNrioNz9UusLHb-zFm7fQ-d6oFAEYE6nUYmwHSxAp-l56DL8ccTmR5NmWcVgKGWvVhcpssmHkU-Ynm4wc9_XXZOS9HFv2JejNUaqi9pJDZvnnJ9-5',
      alt: 'An expansive, ultra-modern penthouse bedroom featuring floor-to-ceiling windows overlooking a sunset ocean horizon.',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC55NJnYa9OWK-Ca94nk_7L6EZ5mL52PKyVV3bmOLyS-HS-jpbI20hmjpcEr-9cZe4ss5vmbWACBPphqZ68rM7TFGGX2gaCPI5cR3mF_kJi6ygcWo-DFmp9w6Cyjr8AkPLwFjSiVvrXzESwhzlAlUzN_BlLS7XWfpZelzIVu0MVxkT4KtrX_4V93d5Nos2govd80lJQf6uBCDIpNnKukOmlfPe8wN5hZbNcIDZTeiLZ3abG8e8eeWzUHNibm2ZmdAp3A2bCQeCy649H',
      alt: 'A pristine, spa-like bathroom in an executive suite featuring a deep soaking marble bathtub.',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdDbk3RkWAPSp2oT6OCe6iFrtjMHmmJ_doQrZAQ848m6Clmllvt9IWyEV2HDWtEtKxj45qtYXtVw2IltpkurvM1q3pvhshXdOeanslKzQT6-E55Zad8Uq9pfTE4J4ar5O_j8PzttEg7K_6GSyh0uzU_JcYciRi8i32zUId8qKDLIXQ7tEnbj2w0gVR4_qjipV8xzzLWA99BUzlzQ1akRVmXiHVku6fz',
      alt: 'A detailed shot of a luxury suite living area featuring a custom velvet armchair.',
    },
  ];

  const rooms: Record<string, Room> = {
    superior: {
      id: 'superior',
      name: 'Superior Double Room',
      price: 280,
      rating: '9.6',
      description: 'Elegant city sanctuary blending high-fidelity interior architecture with modern smart convenience. Unwind with customized ambient options.',
      details: '35 m² • City View • 1 Large Double Bed',
      capacity: 'Max 2 guests',
      size: 'Size: 35 m²',
      bed: '1 Double Bed',
      view: 'City View',
      inHighDemand: false,
      roomsLeft: 5,
    },
    penthouse: {
      id: 'penthouse',
      name: 'Executive Penthouse Suite',
      price: 450,
      rating: '9.8',
      description: 'Ascend to the pinnacle of coastal luxury in our Executive Penthouse Suite. Designed for the discerning traveler, this expansive residence blends architectural precision with an editorial aesthetic. Every detail—from the bespoke walnut cabinetry to the curated art pieces—reflects our commitment to \'Quiet Luxury\'. Enjoy panoramic views of the ocean from your private terrace, or unwind in the integrated smart living area powered by our proprietary AI concierge.',
      details: '85 m² • Ocean View • 1 King Bed',
      capacity: 'Max 4 guests',
      size: 'Size: 85 m²',
      bed: '1 King Bed',
      view: 'Ocean View',
      inHighDemand: true,
      roomsLeft: 2,
    },
  };

  const selectedRoom = rooms[selectedRoomId] || rooms.penthouse;

  // Nights and Total Fee Calculator (Optimized Render-Time Calculation)
  let nights = 3;
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nights = diffDays > 0 ? diffDays : 1;
  }
  const dailyRate = selectedRoom.price;
  const conciergeFeePerNight = 15;
  const roomTotal = dailyRate * nights;
  const totalConciergeFee = conciergeFeePerNight * nights;
  const grandTotal = roomTotal + totalConciergeFee;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx !== null) {
      setActivePhotoIdx(prev => (prev === null ? null : (prev - 1 + images.length) % images.length));
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx !== null) {
      setActivePhotoIdx(prev => (prev === null ? null : (prev + 1) % images.length));
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="pt-8 pb-20 px-6 max-w-7xl mx-auto w-full font-be-vietnam mt-8 animate-fade-in">
      {/* Section A: Image Gallery Component */}
      <ImageGallery
        images={images}
        activePhotoIdx={activePhotoIdx}
        setActivePhotoIdx={setActivePhotoIdx}
        handlePrevPhoto={handlePrevPhoto}
        handleNextPhoto={handleNextPhoto}
      />

      {/* Two Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (70%) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section B, C, D: Room Info Component */}
          <RoomInfo
            selectedRoom={selectedRoom}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />

          {/* Section 1: Room Availability Component */}
          <RoomAvailability
            checkIn={checkIn}
            setCheckIn={setCheckIn}
            checkOut={checkOut}
            setCheckOut={setCheckOut}
            guests={guests}
            setGuests={setGuests}
            selectedRoomId={selectedRoomId}
            setSelectedRoomId={setSelectedRoomId}
            rooms={rooms}
            formatDisplayDate={formatDisplayDate}
          />

          {/* Section 2: Guest Reviews Component */}
          <GuestReviews selectedRoom={selectedRoom} />

          {/* Section 3: Nearby Attractions Component */}
          <NearbyAttractions />

          {/* Section 4: Property Facilities Component */}
          <PropertyFacilities />

          {/* Section 5, 6, 7: House Rules, Notes, FAQs Accordions Component */}
          <HouseRules />
        </div>

        {/* Right Column (30%) - Sticky Booking Card Component */}
        <div className="lg:col-span-4 relative lg:sticky lg:top-24">
          <BookingCard
            selectedRoom={selectedRoom}
            checkIn={checkIn}
            setCheckIn={setCheckIn}
            checkOut={checkOut}
            setCheckOut={setCheckOut}
            guests={guests}
            setGuests={setGuests}
            nights={nights}
            roomTotal={roomTotal}
            totalConciergeFee={totalConciergeFee}
            grandTotal={grandTotal}
            onReserve={() => setShowConfirmation(true)}
          />
        </div>
      </div>

      {/* Booking Confirmation Dialog Overlay Component */}
      {showConfirmation && (
        <BookingConfirmation
          selectedRoom={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          nights={nights}
          grandTotal={grandTotal}
          setShowConfirmation={setShowConfirmation}
          formatDisplayDate={formatDisplayDate}
        />
      )}
    </main>
  );
}
