import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BookingStepper } from '../../components/BookingInformation/BookingStepper';
import { BookingSidebar } from '../../components/BookingInformation/BookingSidebar';
import { BookingDetailsForm } from '../../components/BookingInformation/BookingDetailsForm';
import { BookingPerks } from '../../components/BookingInformation/BookingPerks';
import { Button } from '../../components/ui/button';

interface BookingFormValues {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phone: string;
  specialRequests?: string;
  arrivalTime?: string;
}

export default function BookingInformation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state passed from Details page transitions
  const bookingState = location.state || {};
  const checkIn = bookingState.checkIn || '2024-10-24';
  const checkOut = bookingState.checkOut || '2024-10-27';
  const guests = bookingState.guests || '2 Adults';
  const selectedRoom = bookingState.selectedRoom || {
    name: 'Executive Penthouse Suite',
    price: 450,
  };

  // Stay Nights Calculation
  let nights = 3;
  if (checkIn && checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    nights = diffDays > 0 ? diffDays : 1;
  }

  // Summary Stateful Overlay
  const [successDetails, setSuccessDetails] =
    useState<BookingFormValues | null>(null);

  const handleFormSubmit = (values: BookingFormValues) => {
    setSuccessDetails(values);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const roomTotal = selectedRoom.price * nights;

  return (
    <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 font-be-vietnam animate-fade-in w-full mt-4">
      {/* Stepper Progress Banner */}
      <BookingStepper />

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Component (Desktop Left / Mobile Top) */}
        <div className="lg:col-span-4 lg:order-1 space-y-6">
          <BookingSidebar
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            guests={guests}
            roomName={selectedRoom.name}
            pricePerNight={selectedRoom.price}
            formatDisplayDate={formatDisplayDate}
          />
        </div>

        {/* Main Sections (Desktop Right / Mobile Bottom) */}
        <section className="lg:col-span-8 space-y-6 lg:order-2">
          {/* Details Form Component */}
          <BookingDetailsForm onSubmit={handleFormSubmit} />

          {/* Included Perks Component */}
          <BookingPerks />
        </section>
      </div>

      {/* Success Confirmation Modal */}
      {successDetails && (
        <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-card p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-6 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-500/20 shadow-inner">
              <span
                className="material-symbols-outlined text-3xl animate-bounce"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-2xl text-on-surface">
                Details Saved Successfully
              </h3>
              <p className="text-xs text-on-surface-variant font-semibold">
                Your reservation details are ready. Review summary before final
                authorization.
              </p>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 text-left text-xs space-y-3.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-semibold">
                  Name:
                </span>
                <span className="text-on-surface font-bold">
                  {successDetails.firstName} {successDetails.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-semibold">
                  Email:
                </span>
                <span className="text-on-surface font-bold break-all">
                  {successDetails.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-semibold">
                  Phone:
                </span>
                <span className="text-on-surface font-bold">
                  {successDetails.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-semibold">
                  Dates:
                </span>
                <span className="text-on-surface font-bold">
                  {formatDisplayDate(checkIn)} — {formatDisplayDate(checkOut)} (
                  {nights} {nights === 1 ? 'Night' : 'Nights'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-semibold">
                  Suite selected:
                </span>
                <span className="text-on-surface font-bold leading-tight text-right max-w-50">
                  {selectedRoom.name}
                </span>
              </div>
              {successDetails.arrivalTime &&
                successDetails.arrivalTime !== 'Please select' && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-semibold">
                      Arrival Time:
                    </span>
                    <span className="text-on-surface font-bold">
                      {successDetails.arrivalTime}
                    </span>
                  </div>
                )}
              <hr className="border-outline-variant/10" />
              <div className="flex justify-between text-sm font-bold text-on-surface pt-1">
                <span>Grand Total:</span>
                <span className="text-base text-primary">${roomTotal}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-surface-container-low transition-all border border-outline-variant h-11"
                onClick={() => setSuccessDetails(null)}
              >
                Edit details
              </Button>
              <Button
                className="flex-1 bg-primary text-white py-3 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-on-surface transition-all active:scale-[0.98] cursor-pointer shadow-md h-11 border-none"
                onClick={() => {
                  setSuccessDetails(null);
                  alert('Thank you! Booking complete. Redirecting home...');
                  navigate('/');
                }}
              >
                Finish Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
