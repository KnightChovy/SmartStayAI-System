import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FileUploadDropzone } from '@/components/ui/file-upload';

export function RepresentativeVerificationStep({ onBack, onContinue }: { onBack?: () => void, onContinue?: () => void }) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Representative Verification</h2>
        <p className="text-slate-600">
          Provide the personal details and identity documents of the legal representative.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Personal Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Representative Full Name <span className="text-red-500">*</span></Label>
              <Input id="fullName" placeholder="e.g. Nguyen Van A" className="h-11 border-slate-200" required />
            </div>

            <div className="space-y-2">
              <Label>Role <span className="text-red-500">*</span></Label>
              <Select required>
                <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="general_manager">General Manager</SelectItem>
                  <SelectItem value="legal_representative">Legal Representative</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
              <Input id="dob" type="date" className="h-11 border-slate-200 text-slate-700" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number Card <span className="text-red-500">*</span></Label>
              <Input id="idNumber" placeholder="e.g. 012345678912" className="h-11 border-slate-200" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
              <Input id="phone" placeholder="+84 900 000 000" className="h-11 border-slate-200" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
              <Input id="address" placeholder="Full residential address" className="h-11 border-slate-200" required />
            </div>
          </div>
        </div>

        {/* Identity Document */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Identity Document</h3>
          <p className="text-sm text-slate-500 mb-4">Please upload clear photos of your ID Card or Passport. Make sure all details are readable.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadDropzone label="Image Front Side" accept=".pdf,.jpg,.jpeg,.png" />
            <FileUploadDropzone label="Image Back Side" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button type="button" variant="outline" onClick={onBack} className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer hidden md:flex">
              Save Draft
            </Button>
            <Button type="submit" className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
