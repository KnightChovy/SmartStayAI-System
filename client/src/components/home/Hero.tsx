import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router';
import { Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toDateInputValue } from '@/utils/formatDate';

const heroSearchSchema = z.object({
  destination: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().min(1).max(20),
});

type HeroSearchFormValues = z.infer<typeof heroSearchSchema>;

export default function Hero() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch } = useForm<HeroSearchFormValues>({
    resolver: zodResolver(heroSearchSchema),
    defaultValues: {
      destination: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
    },
  });

  const today = toDateInputValue(new Date());
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guests = watch('guests');

  // Đổi ngày nhận: nếu ngày trả <= ngày nhận mới thì đẩy ngày trả lên +1 ngày
  const handleCheckIn = (value: string) => {
    setValue('checkIn', value);
    if (!checkOut || new Date(checkOut) <= new Date(value)) {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      setValue('checkOut', toDateInputValue(d));
    }
  };

  const onSubmit = (values: HeroSearchFormValues) => {
    const params = new URLSearchParams();
    if (values.destination) params.set('city', values.destination);
    // checkIn/checkOut phải đi cùng nhau thì backend mới tính tồn kho + giá kỳ ở
    if (values.checkIn && values.checkOut) {
      params.set('checkIn', values.checkIn);
      params.set('checkOut', values.checkOut);
    }
    params.set('guests', String(values.guests));
    const query = params.toString();
    navigate(query ? `/search?${query}` : '/search');
  };

  return (
    <section className="relative pt-20 pb-24 px-margin-mobile overflow-hidden bg-surface w-full">
      {/* Background image layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      {/* Light gradient overlay keeps dark text & white search bar readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-linear-to-b from-surface via-surface/85 to-surface/60"
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
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
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-2 rounded-3xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 border border-outline-variant/20"
        >
          <div className="w-full md:flex-[1.5] px-6 py-3 flex flex-col group">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Destination
            </label>
            <Input
              {...register('destination')}
              className="w-full bg-transparent border-none p-0 focus:ring-0 focus-visible:ring-0 text-sm placeholder:text-outline/50 font-medium outline-none mt-1 shadow-none h-auto"
              placeholder="Where are you going?"
              type="text"
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30"></div>
          <div className="w-full md:flex-1 px-6 py-3 flex flex-col">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={e => handleCheckIn(e.target.value)}
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface outline-none mt-1"
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30"></div>
          <div className="w-full md:flex-1 px-6 py-3 flex flex-col">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={e => setValue('checkOut', e.target.value)}
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-on-surface outline-none mt-1"
            />
          </div>
          <div className="hidden md:block w-px h-8 bg-outline-variant/30"></div>
          <div className="w-full md:flex-1 px-6 py-3 flex flex-col">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Guests
            </label>
            <div className="mt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setValue('guests', Math.max(1, guests - 1))}
                disabled={guests <= 1}
                className="flex size-6 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                aria-label="Decrease guests"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-semibold text-on-surface">{guests}</span>
              <button
                type="button"
                onClick={() => setValue('guests', Math.min(20, guests + 1))}
                disabled={guests >= 20}
                className="flex size-6 items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 hover:text-primary disabled:opacity-30"
                aria-label="Increase guests"
              >
                <Plus className="size-4" />
              </button>
            </div>
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
