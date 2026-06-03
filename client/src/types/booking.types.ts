import type { BookingFormValues } from '@/validations/booking.validation';

export interface BookingDetailsFormProps {
  onSubmit: (values: BookingFormValues) => void;
}

export interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  roomName: string;
  pricePerNight: number;
  formatDisplayDate: (dateStr: string) => string;
}
