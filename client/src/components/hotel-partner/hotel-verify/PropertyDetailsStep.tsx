import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FileUploadDropzone } from '@/components/ui/file-upload';

export function PropertyDetailsStep({ onBack, onContinue }: { onBack?: () => void, onContinue?: () => void }) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Business License</h2>
        <p className="text-slate-600">
          Provide your legal business documentation and licensing details.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Business License Number <span className="text-red-500">*</span></Label>
          <Input id="licenseNumber" placeholder="e.g. 1234567890" className="h-11 border-slate-200" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="issueDate">License Issue Date <span className="text-red-500">*</span></Label>
            <Input id="issueDate" type="date" className="h-11 border-slate-200 text-slate-700" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">License Expiry Date</Label>
            <Input id="expiryDate" type="date" className="h-11 border-slate-200 text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="authority">Issuing Authority <span className="text-red-500">*</span></Label>
            <Input id="authority" placeholder="e.g. Department of Planning and Investment" className="h-11 border-slate-200" required />
          </div>
          <div className="space-y-2">
            <Label>License Status</Label>
            <Select defaultValue="active">
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Renewal</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <FileUploadDropzone label="Business License Document" helperText="SVG, PNG, JPG or PDF (max. 5MB)" accept=".pdf,.jpg,.jpeg,.png" />
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
