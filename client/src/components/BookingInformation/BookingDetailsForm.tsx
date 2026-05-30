import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router';

const bookingSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  country: z.string().min(1, { message: 'Please select your country.' }),
  phone: z.string().min(6, { message: 'Please enter a valid phone number.' }),
  specialRequests: z.string().optional(),
  arrivalTime: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingDetailsFormProps {
  onSubmit: (values: BookingFormValues) => void;
}

export function BookingDetailsForm({ onSubmit }: BookingDetailsFormProps) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: 'United States',
      phone: '',
      specialRequests: '',
      arrivalTime: 'Please select',
    },
  });

  return (
    <div className="space-y-6 font-be-vietnam">
      {/* Login Banner */}
      <div className="bg-white dark:bg-card border border-outline-variant/20 rounded-2xl p-5 flex items-center shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl">person</span>
          </div>
          <p className="text-sm font-semibold text-on-surface">
            Please{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-secondary font-bold hover:text-primary transition-colors cursor-pointer border-b-2 border-secondary/50 hover:border-primary pb-0.5"
            >
              Log In
            </span>{' '}
            or{' '}
            <span
              onClick={() => navigate('/register')}
              className="text-secondary font-bold hover:text-primary transition-colors cursor-pointer border-b-2 border-secondary/50 hover:border-primary pb-0.5"
            >
              Register
            </span>{' '}
            to book with your saved details.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Details Form */}
        <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm p-6 md:p-8 space-y-6">
          <h2 className="font-bold text-xl text-on-surface">Enter your details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">First Name</label>
              <input
                {...register('firstName')}
                className="w-full bg-surface-container-low dark:bg-surface-dim/40 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary border border-outline-variant/25 transition-all outline-none"
                placeholder="e.g. Alexander"
                type="text"
              />
              {errors.firstName && (
                <p className="text-[10px] text-error font-semibold px-1">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">Last Name</label>
              <input
                {...register('lastName')}
                className="w-full bg-surface-container-low dark:bg-surface-dim/40 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary border border-outline-variant/25 transition-all outline-none"
                placeholder="e.g. Sterling"
                type="text"
              />
              {errors.lastName && (
                <p className="text-[10px] text-error font-semibold px-1">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">Email Address</label>
              <input
                {...register('email')}
                className="w-full bg-surface-container-low dark:bg-surface-dim/40 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary border border-outline-variant/25 transition-all outline-none"
                placeholder="alexander.sterling@luxe.com"
                type="email"
              />
              <p className="text-[9px] text-outline font-semibold px-1 italic">Confirmation email will be sent here</p>
              {errors.email && (
                <p className="text-[10px] text-error font-semibold px-1">{errors.email.message}</p>
              )}
            </div>

            {/* Country/Region */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">Country/Region</label>
              <select
                {...register('country')}
                className="w-full bg-surface-container-low dark:bg-surface-dim/40 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary border border-outline-variant/25 transition-all outline-none appearance-none"
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="France">France</option>
                <option value="Japan">Japan</option>
                <option value="Vietnam">Vietnam</option>
              </select>
              {errors.country && (
                <p className="text-[10px] text-error font-semibold px-1">{errors.country.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">Phone Number</label>
              <input
                {...register('phone')}
                className="w-full bg-surface-container-low dark:bg-surface-dim/40 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary border border-outline-variant/25 transition-all outline-none"
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
              {errors.phone && (
                <p className="text-[10px] text-error font-semibold px-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Special Requests Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="font-bold text-xl text-on-surface">Special requests</h2>
          <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
            Special requests cannot be guaranteed – but the property will do its best to meet your needs. You can always make a special request after your booking is complete!
          </p>
          <textarea
            {...register('specialRequests')}
            className="w-full bg-surface-container-low dark:bg-surface-dim/40 border border-outline-variant/25 rounded-2xl px-4 py-4 h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold resize-none"
            placeholder="Please write your requests here..."
          ></textarea>
        </div>

        {/* Arrival Time Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-outline-variant/20 shadow-sm p-6 md:p-8 space-y-4">
          <h2 className="font-bold text-xl text-on-surface">Your arrival time</h2>
          <div className="flex items-center gap-3 bg-surface-container-low/50 px-4 py-3 rounded-2xl border border-outline-variant/10 max-w-sm">
            <span className="material-symbols-outlined text-secondary text-xl">schedule</span>
            <p className="text-xs font-bold text-on-surface-variant">Check-in from 15:00 to 00:00</p>
          </div>
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] text-outline font-bold uppercase tracking-wider px-1">Add your estimated arrival time</label>
            <select
              {...register('arrivalTime')}
              className="w-full bg-surface-container-low dark:bg-surface-dim/40 border border-outline-variant/25 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all max-w-sm appearance-none"
            >
              <option value="Please select">Please select</option>
              <option value="15:00 - 16:00">15:00 - 16:00</option>
              <option value="16:00 - 17:00">16:00 - 17:00</option>
              <option value="17:00 - 18:00">17:00 - 18:00</option>
              <option value="I don't know">I don't know</option>
            </select>
          </div>
        </div>

        {/* Final CTA Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="bg-primary text-white hover:bg-on-surface px-10 py-6 rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-3 cursor-pointer border-none h-12"
          >
            Next: Final Details
            <span className="material-symbols-outlined font-bold text-sm">arrow_forward</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
