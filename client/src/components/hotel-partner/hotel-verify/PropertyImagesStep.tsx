import React from 'react';
import { Button } from '@/components/ui/button';

import { FileUploadDropzone } from '@/components/ui/file-upload';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export function PropertyImagesStep({ onBack, onContinue }: { onBack?: () => void, onContinue?: () => void }) {
  const qualityChecklist = [
    "High resolution (at least 1920x1080px recommended)",
    "Well-lit, natural lighting preferred",
    "No watermarks, logos, or text overlays",
    "Clean and tidy spaces",
    "Accurate representation of the property"
  ];

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Images</h2>
        <p className="text-slate-600">
          Upload high-quality images of your property to attract guests. A minimum of 5 images is required to submit your listing.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); onContinue?.(); }}>
        
        {/* Quality Checklist */}
        <div className="bg-role-partner-light/40 border border-role-partner-light rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Image Quality Checklist</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qualityChecklist.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-role-partner-primary shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 1. Cover Image */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Cover Image</h3>
          <p className="text-sm text-slate-500">This is the first image guests will see. Choose a stunning exterior or interior shot.</p>
          <FileUploadDropzone label="Cover Image" isLarge helperText="JPG or PNG (max. 10MB)" accept=".jpg,.jpeg,.png" multiple minFiles={1} />
        </div>

        {/* 2. Exterior Image */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Exterior Image</h3>
          <p className="text-sm text-slate-500">Show the outside of the building or the main entrance.</p>
          <FileUploadDropzone label="Exterior Image" helperText="JPG or PNG (max. 10MB)" accept=".jpg,.jpeg,.png" multiple minFiles={1} />
        </div>

        {/* 3. Room Images */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">3. Room Images</h3>
          <p className="text-sm text-slate-500">Provide clear photos of the bedrooms, bathrooms, and living areas (minimum 3 images).</p>
          <FileUploadDropzone label="Room Images" helperText="Bedroom, Bathroom, etc." accept=".jpg,.jpeg,.png" multiple minFiles={3} />
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
