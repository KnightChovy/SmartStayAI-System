import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUploadDropzone } from '@/components/ui/file-upload';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';

const qualityChecklist = [
  'High resolution (at least 1920x1080px recommended)',
  'Well-lit, natural lighting preferred',
  'No watermarks, logos, or text overlays',
  'Clean and tidy spaces',
  'Accurate representation of the property',
];

export function PropertyImagesStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setPropertyImages } = useHotelVerifyStore();
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [exteriorFiles, setExteriorFiles] = useState<File[]>([]);
  const [roomFiles, setRoomFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{
    cover?: string;
    exterior?: string;
    room?: string;
    general?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (coverFiles.length < 1) newErrors.cover = 'At least 1 cover image is required';
    if (exteriorFiles.length < 1) newErrors.exterior = 'At least 1 exterior image is required';
    if (roomFiles.length < 3) newErrors.room = 'At least 3 room images are required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsUploading(true);

    try {
      const [coverUrls, exteriorUrls, roomUrls] = await Promise.all([
        Promise.all(coverFiles.map((f) => hotelVerifyService.uploadFile(f))),
        Promise.all(exteriorFiles.map((f) => hotelVerifyService.uploadFile(f))),
        Promise.all(roomFiles.map((f) => hotelVerifyService.uploadFile(f))),
      ]);
      setPropertyImages({
        coverImages: coverUrls,
        exteriorImages: exteriorUrls,
        roomImages: roomUrls,
      });
      onContinue?.();
    } catch {
      setErrors({ general: 'Some uploads failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Images</h2>
        <p className="text-slate-600">
          Upload high-quality images of your property to attract guests. A minimum of 5 images is
          required to submit your listing.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-8" onSubmit={handleSubmit}>
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
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Cover Image <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-slate-500">
            This is the first image guests will see. Choose a stunning exterior or interior shot.
          </p>
          <FileUploadDropzone
            label="Cover Image"
            isLarge
            helperText="JPG or PNG (max. 10MB)"
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={1}
            onFilesChange={setCoverFiles}
            error={errors.cover}
          />
        </div>

        {/* 2. Exterior Image */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Exterior Image <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-slate-500">
            Show the outside of the building or the main entrance.
          </p>
          <FileUploadDropzone
            label="Exterior Image"
            helperText="JPG or PNG (max. 10MB)"
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={1}
            onFilesChange={setExteriorFiles}
            error={errors.exterior}
          />
        </div>

        {/* 3. Room Images */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Room Images <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-slate-500">
            Provide clear photos of the bedrooms, bathrooms, and living areas (minimum 3 images).
          </p>
          <FileUploadDropzone
            label="Room Images"
            helperText="Bedroom, Bathroom, etc."
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={3}
            onFilesChange={setRoomFiles}
            error={errors.room}
          />
        </div>

        {errors.general && (
          <p className="text-sm text-red-500 text-center">{errors.general}</p>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 px-6 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer hidden md:flex"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isUploading}
              className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer"
            >
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
