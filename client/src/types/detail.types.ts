import type { MouseEvent } from 'react';
import type { Room, RoomImage } from '@/types/room.types';

export interface ImageGalleryProps {
  images: RoomImage[];
  activePhotoIdx: number | null;
  setActivePhotoIdx: (idx: number | null) => void;
  handlePrevPhoto: (e: MouseEvent) => void;
  handleNextPhoto: (e: MouseEvent) => void;
}

export interface RoomInfoProps {
  selectedRoom: Room;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

export interface RoomAvailabilityProps {
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

export interface BookingCardProps {
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

export interface GuestReviewsProps {
  selectedRoom: Room;
}

export interface BookingConfirmationProps {
  selectedRoom: Room;
  checkIn: string;
  checkOut: string;
  guests: string;
  nights: number;
  grandTotal: number;
  setShowConfirmation: (val: boolean) => void;
  formatDisplayDate: (dateStr: string) => string;
}
