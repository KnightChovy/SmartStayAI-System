import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  BadgeCheck,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  businessInfoSchema,
  type BusinessInfoFormValues,
} from '@/validations/hotel-verify.validation';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';
import {
  autocompleteAddress,
  getPlaceDetail,
  parseVietmapDisplay,
} from '@/services/vietnam-geo.service';
import type { VietmapSuggestion } from '@/types/vietnam-geo.types';
import { PropertyMapPicker, type FlyTarget } from './PropertyMapPicker';

interface AddressSearchProps {
  onSelect: (suggestion: VietmapSuggestion) => void;
}

function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<VietmapSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await autocompleteAddress(val);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 350);
  }, []);

  const handleSelect = useCallback(
    (s: VietmapSuggestion) => {
      setQuery(s.display);
      setSuggestions([]);
      setOpen(false);
      onSelect(s);
    },
    [onSelect]
  );

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search for an address to autofill..."
          className="h-11 border-slate-200 pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map(s => (
            <li key={s.ref_id}>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <span className="font-medium text-slate-800 block leading-tight">
                  {s.name}
                </span>
                <span className="text-slate-500 text-xs">{s.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main step component ───────────────────────────────────────────────────────

export function BusinessInfoStep({ onContinue }: { onContinue?: () => void }) {
  const { setBusinessInfo, draft } = useHotelVerifyStore();
  const [mapFlyTarget, setMapFlyTarget] = useState<FlyTarget | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<BusinessInfoFormValues>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: draft.businessInfo ?? {
      businessName: '',
      businessType: 'hotel',
      businessRegistrationNumber: '',
      taxCode: '',
      phone: '',
      email: '',
      address: '',
      cityProvince: '',
      ward: '',
    },
  });

  useEffect(() => {
    setValue('businessType', 'hotel');
  }, [setValue]);

  const locationValue = watch('location');

  const handleAddressSelect = useCallback(
    async (s: VietmapSuggestion) => {
      const { province, ward } = parseVietmapDisplay(s.display);
      if (province)
        setValue('cityProvince', province, { shouldValidate: true });
      if (ward) setValue('ward', ward);

      // Prefill Full Address with the whole selected place, but only when it's
      // still empty so a search never overwrites what the partner typed by hand.
      if (!getValues('address')?.trim()) {
        setValue('address', s.display, { shouldValidate: true });
      }

      let lat = s.lat;
      let lng = s.lng;

      if (!lat || !lng) {
        const detail = await getPlaceDetail(s.ref_id);
        if (detail) {
          lat = detail.lat;
          lng = detail.lng;
        }
      }

      if (lat && lng) {
        setMapFlyTarget({
          lat,
          lng,
          zoom: 16,
          label: s.display,
          autoPin: true,
        });
      }
    },
    [setValue, getValues]
  );

  const onSubmit = (data: BusinessInfoFormValues) => {
    setBusinessInfo(data);
    onContinue?.();
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Business Information
        </h2>
        <p className="text-slate-600">
          Provide the official details for your property. This information will
          be verified against public records.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="businessName"
            placeholder="e.g. The Grand Continental"
            className="h-11 border-slate-200"
            {...register('businessName')}
          />
          {errors.businessName && (
            <span className="text-xs text-red-500">
              {errors.businessName.message}
            </span>
          )}
        </div>

        {/* Business Type + Registration Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>
              Property Type <span className="text-red-500">*</span>
            </Label>
            <div className="h-11 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-700">
              <BadgeCheck className="w-4 h-4 text-role-partner-primary" />
              <span className="font-medium">Hotel</span>
              <span className="ml-auto text-xs text-slate-400">
                Hotels only
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessRegistrationNumber">
              Business Registration Number{' '}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessRegistrationNumber"
              placeholder="e.g. 1234567890"
              className="h-11 border-slate-200"
              {...register('businessRegistrationNumber')}
            />
            {errors.businessRegistrationNumber && (
              <span className="text-xs text-red-500">
                {errors.businessRegistrationNumber.message}
              </span>
            )}
          </div>
        </div>

        {/* Tax Code + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="taxCode">Tax Code</Label>
            <Input
              id="taxCode"
              placeholder="Optional"
              className="h-11 border-slate-200"
              {...register('taxCode')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Hotel Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="+84 (0) 900 000 000"
              className="h-11 border-slate-200"
              {...register('phone')}
            />
            {errors.phone && (
              <span className="text-xs text-red-500">
                {errors.phone.message}
              </span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Hotel Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@hotel.com"
            className="h-11 border-slate-200"
            {...register('email')}
          />
          {errors.email && (
            <span className="text-xs text-red-500">{errors.email.message}</span>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">
            Full Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="House number, street name, building, floor — or search below."
            className="h-11 border-slate-200"
            {...register('address')}
          />
          {errors.address && (
            <span className="text-xs text-red-500">
              {errors.address.message}
            </span>
          )}
        </div>

        {/* VietMap Address Search */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            Address Search
            <span className="text-xs text-slate-500 font-normal">
              — Search an address to auto-fill the address, city/province,
              ward/commune, and map location.
            </span>
          </Label>
          <AddressSearch onSelect={handleAddressSelect} />
        </div>

        {/* City/Province + Ward */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cityProvince">
              City / Province <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cityProvince"
              placeholder="Auto-filled from search or type manually"
              className="h-11 border-slate-200"
              {...register('cityProvince')}
            />
            {errors.cityProvince && (
              <span className="text-xs text-red-500">
                {errors.cityProvince.message}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="ward">Ward / Commune</Label>
              <span className="text-xs text-slate-500">(Optional)</span>
            </div>
            <Input
              id="ward"
              placeholder="Auto-filled from search or type manually"
              className="h-11 border-slate-200"
              {...register('ward')}
            />
          </div>
        </div>

        {/* Map */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-role-partner-primary" />
              Pin Property Location <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 font-normal">
                (click on the map)
              </span>
            </Label>
            {locationValue && (
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                Pinned: {locationValue.lat.toFixed(5)},{' '}
                {locationValue.lng.toFixed(5)}
              </span>
            )}
          </div>
          <div
            className={cn(
              'w-full h-52 sm:h-72 rounded-xl overflow-hidden border shadow-sm',
              errors.location ? 'border-red-300' : 'border-slate-200'
            )}
          >
            <PropertyMapPicker
              value={locationValue}
              onChange={loc =>
                setValue('location', loc, { shouldValidate: true })
              }
              flyTarget={mapFlyTarget}
            />
          </div>
          {errors.location && (
            <span className="text-xs text-red-500">
              {errors.location.message}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
