import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FileUploadDropzone } from '@/components/ui/file-upload';

export function AccommodationCertificateStep({ onBack, onContinue }: { onBack?: () => void, onContinue?: () => void }) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Accommodation Certificate</h2>
        <p className="text-slate-600">
          Provide your operating licenses and safety certificates to comply with local regulations.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        {/* 1. Accommodation Operating License */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Accommodation Operating License</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="opLicenseNumber">License Number <span className="text-red-500">*</span></Label>
              <Input id="opLicenseNumber" placeholder="e.g. 1234567890" className="h-11 border-slate-200" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opIssueDate">Issue Date <span className="text-red-500">*</span></Label>
              <Input id="opIssueDate" type="date" className="h-11 border-slate-200 text-slate-700" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="opAuthority">Issuing Authority <span className="text-red-500">*</span></Label>
              <Input id="opAuthority" placeholder="e.g. Department of Tourism" className="h-11 border-slate-200" required />
            </div>
          </div>
          <FileUploadDropzone label="Upload Document" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        {/* 2. Fire Safety Certificate (PCCC) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Fire Safety Certificate (PCCC)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fireCertNumber">Certificate Number <span className="text-red-500">*</span></Label>
              <Input id="fireCertNumber" placeholder="e.g. PCCC-2023-001" className="h-11 border-slate-200" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fireIssueDate">Issue Date <span className="text-red-500">*</span></Label>
              <Input id="fireIssueDate" type="date" className="h-11 border-slate-200 text-slate-700" required />
            </div>
          </div>
          <FileUploadDropzone label="Upload Document" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        {/* 3. Security & Order Certificate (ANTT) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>3. Security & Order Certificate (ANTT)</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Optional</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="securityCertNumber">Certificate Number</Label>
              <Input id="securityCertNumber" placeholder="e.g. ANTT-2023-001" className="h-11 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityIssueDate">Issue Date</Label>
              <Input id="securityIssueDate" type="date" className="h-11 border-slate-200 text-slate-700" />
            </div>
          </div>
          <FileUploadDropzone label="Upload Document" accept=".pdf,.jpg,.jpeg,.png" />
        </div>

        {/* 4. Hotel Classification */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>4. Hotel Classification</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Optional</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Star Rating</Label>
              <Select>
                <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                  <SelectValue placeholder="Select star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="unrated">Unrated / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <FileUploadDropzone label="Rating Certificate" accept=".pdf,.jpg,.jpeg,.png" />
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
