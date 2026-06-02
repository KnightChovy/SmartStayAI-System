import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ArrowRight } from 'lucide-react';

export function BusinessInfoStep({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Business Information</h2>
        <p className="text-slate-600">
          Provide the official details for your property. This information will be verified against public records.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        {/* Row 1 */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name <span className="text-red-500">*</span></Label>
          <Input id="businessName" placeholder="e.g. The Grand Continental" className="h-11 border-slate-200" />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Business Type <span className="text-red-500">*</span></Label>
            <Select>
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessRegistrationNumber">Business Registration Number <span className="text-red-500">*</span></Label>
            <Input id="businessRegistrationNumber" placeholder="e.g. 1234567890" className="h-11 border-slate-200" />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="taxCode">Tax Code</Label>
            <Input id="taxCode" placeholder="Optional" className="h-11 border-slate-200" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Hotel Phone Number <span className="text-red-500">*</span></Label>
            <Input id="phone" placeholder="+1 (555) 000-0000" className="h-11 border-slate-200" />
          </div>
        </div>

        {/* Row 4 */}
        <div className="space-y-2">
          <Label htmlFor="email">Hotel Email <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" placeholder="contact@hotel.com" className="h-11 border-slate-200" />
        </div>

        {/* Row 5 */}
        <div className="space-y-2">
          <Label htmlFor="address">Full Address <span className="text-red-500">*</span></Label>
          <Input id="address" placeholder="Street address, building, floor" className="h-11 border-slate-200" />
        </div>

        {/* Row 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>City / Province <span className="text-red-500">*</span></Label>
            <Select>
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hanoi">Hanoi</SelectItem>
                <SelectItem value="hcmc">Ho Chi Minh City</SelectItem>
                <SelectItem value="danang">Da Nang</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>District <span className="text-red-500">*</span></Label>
            <Select>
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="d1">District 1</SelectItem>
                <SelectItem value="d2">District 2</SelectItem>
                <SelectItem value="d3">District 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 7 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Ward</Label>
            <Select>
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="w1">Ward 1</SelectItem>
                <SelectItem value="w2">Ward 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="w-full h-48 bg-[#eef2f6] rounded-xl relative overflow-hidden mt-6 flex items-center justify-center border border-slate-200 group">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-60 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=10.762622,106.660172&zoom=14&size=800x400&maptype=roadmap&style=feature:all|element:labels|visibility:off&style=feature:road|element:geometry|color:0xffffff&style=feature:landscape|element:geometry|color:0xe5e7eb')] bg-cover bg-center mix-blend-multiply"></div>
          
          <Button type="button" variant="outline" className="bg-white shadow-sm relative z-10 hover:bg-slate-50 text-slate-800 border-slate-200 rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-role-partner-primary" />
            Pin Property Location
          </Button>

          {/* Big Map Pin Icon (Decorative) */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-40 opacity-10 pointer-events-none flex flex-col items-center">
             <div className="w-0 h-0 border-l-60 border-l-transparent border-r-60 border-r-transparent border-t-80 border-t-role-partner-primary translate-y-16 absolute"></div>
             <div className="w-32 h-32 rounded-full bg-role-partner-primary absolute -top-4"></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100 mt-8">
          <Button type="button" variant="outline" className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            Save Draft
          </Button>
          <Button type="submit" className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
