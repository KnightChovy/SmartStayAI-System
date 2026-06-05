import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import type { BookingConfirmationProps } from '@/types/detail.types';

export function BookingConfirmation({
  selectedRoom,
  checkIn,
  checkOut,
  guests,
  nights,
  grandTotal,
  setShowConfirmation,
  formatDisplayDate,
}: BookingConfirmationProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-6 text-center animate-scale-in">
        <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto text-primary border border-outline-variant/20 shadow-inner">
          <span className="material-symbols-outlined text-3xl animate-pulse">
            hotel
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-2xl text-on-surface">
            Confirm Your Reservation
          </h3>
          <p className="text-xs text-on-surface-variant font-semibold">
            An editorial AI concierge experience is preparing for your arrival.
          </p>
        </div>

        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 text-left text-xs space-y-3.5">
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-semibold">
              Accommodation:
            </span>
            <span className="text-on-surface font-bold">
              {selectedRoom.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-semibold">
              Dates:
            </span>
            <span className="text-on-surface font-bold text-right">
              {formatDisplayDate(checkIn)} — {formatDisplayDate(checkOut)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-semibold">
              Stay Duration:
            </span>
            <span className="text-on-surface font-bold">
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-semibold">
              Guests count:
            </span>
            <span className="text-on-surface font-bold">{guests}</span>
          </div>
          <hr className="border-outline-variant/10" />
          <div className="flex justify-between text-sm font-bold text-on-surface pt-1">
            <span>Grand Total:</span>
            <span className="text-base text-primary">${grandTotal}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-surface-container-low transition-all border border-outline-variant h-11"
            onClick={() => setShowConfirmation(false)}
          >
            Modify details
          </Button>
          <Button
            className="flex-1 bg-primary text-white py-3 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-on-surface transition-all active:scale-[0.98] cursor-pointer shadow-md h-11 border-none"
            onClick={() => {
              setShowConfirmation(false);
              navigate('/booking-information', {
                state: {
                  checkIn,
                  checkOut,
                  guests,
                  selectedRoom,
                },
              });
            }}
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
}
