import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploadDropzone } from '@/components/ui/file-upload';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Hotel,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';

interface RoomTypeInput {
  name: string;
  quantity: number | '';
}

const qualityChecklist = [
  'High resolution (at least 1920x1080px recommended)',
  'Well-lit, natural lighting preferred',
  'No watermarks, logos, or text overlays',
  'Clean and tidy spaces',
  'Accurate representation of the property',
];

type UploadZone = 'cover' | 'exterior' | 'room';

export function PropertyImagesStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setPropertyImages, draft } = useHotelVerifyStore();

  // Initialise from draft so previously-uploaded URLs survive Back navigation
  const [coverUrls, setCoverUrls] = useState<string[]>(
    draft.propertyImages?.coverImages ?? [],
  );
  const [exteriorUrls, setExteriorUrls] = useState<string[]>(
    draft.propertyImages?.exteriorImages ?? [],
  );
  const [roomUrls, setRoomUrls] = useState<string[]>(
    draft.propertyImages?.roomImages ?? [],
  );

  // Room configuration — total rooms + room types
  const [totalRooms, setTotalRooms] = useState<number | ''>(
    draft.propertyImages?.roomConfig?.totalRooms ?? '',
  );
  const [roomTypes, setRoomTypes] = useState<RoomTypeInput[]>(
    draft.propertyImages?.roomConfig?.roomTypes ?? [{ name: '', quantity: '' }],
  );

  const allocatedRooms = roomTypes.reduce(
    (sum, t) => sum + (Number(t.quantity) || 0),
    0,
  );
  const allocationMatches =
    typeof totalRooms === 'number' && allocatedRooms === totalRooms;

  const updateRoomType = (index: number, patch: Partial<RoomTypeInput>) =>
    setRoomTypes(prev =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  const addRoomType = () =>
    setRoomTypes(prev => [...prev, { name: '', quantity: '' }]);
  const removeRoomType = (index: number) =>
    setRoomTypes(prev => prev.filter((_, i) => i !== index));

  const [uploading, setUploading] = useState<Record<UploadZone, boolean>>({
    cover: false,
    exterior: false,
    room: false,
  });
  const [errors, setErrors] = useState<{
    cover?: string;
    exterior?: string;
    room?: string;
    roomConfig?: string;
    general?: string;
  }>({});

  const buildRoomConfig = () => ({
    totalRooms: Number(totalRooms) || 0,
    roomTypes: roomTypes.map(t => ({
      name: t.name,
      quantity: Number(t.quantity) || 0,
    })),
  });

  // Cập nhật cả 3 mảng ảnh + lưu ngay vào draft để reload không mất file.
  const commitImages = (cover: string[], exterior: string[], room: string[]) => {
    setCoverUrls(cover);
    setExteriorUrls(exterior);
    setRoomUrls(room);
    setPropertyImages({
      coverImages: cover,
      exteriorImages: exterior,
      roomImages: room,
      roomConfig: buildRoomConfig(),
    });
  };

  const uploadZone = async (files: File[], zone: UploadZone) => {
    if (files.length === 0) return;
    setUploading(prev => ({ ...prev, [zone]: true }));
    setErrors(prev => ({ ...prev, [zone]: undefined }));
    try {
      const urls = await Promise.all(files.map(f => hotelVerifyService.uploadFile(f)));
      commitImages(
        zone === 'cover' ? [...coverUrls, ...urls] : coverUrls,
        zone === 'exterior' ? [...exteriorUrls, ...urls] : exteriorUrls,
        zone === 'room' ? [...roomUrls, ...urls] : roomUrls,
      );
    } catch {
      setErrors(prev => ({ ...prev, [zone]: 'Upload failed. Please try again.' }));
    } finally {
      setUploading(prev => ({ ...prev, [zone]: false }));
    }
  };

  const removeImage = (zone: UploadZone, index: number) => {
    commitImages(
      zone === 'cover' ? coverUrls.filter((_, i) => i !== index) : coverUrls,
      zone === 'exterior' ? exteriorUrls.filter((_, i) => i !== index) : exteriorUrls,
      zone === 'room' ? roomUrls.filter((_, i) => i !== index) : roomUrls,
    );
  };

  const isAnyUploading = uploading.cover || uploading.exterior || uploading.room;

  const handleBack = () => {
    // Persist whatever has been entered so far
    const hasData =
      coverUrls.length > 0 ||
      exteriorUrls.length > 0 ||
      roomUrls.length > 0 ||
      totalRooms !== '' ||
      roomTypes.some(t => t.name || t.quantity !== '');
    if (hasData) {
      setPropertyImages({
        coverImages: coverUrls,
        exteriorImages: exteriorUrls,
        roomImages: roomUrls,
        roomConfig: buildRoomConfig(),
      });
    }
    onBack?.();
  };

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (isAnyUploading) {
      setErrors({ general: 'Please wait for uploads to finish.' });
      return;
    }
    const newErrors: typeof errors = {};
    if (coverUrls.length < 1) newErrors.cover = 'At least 1 cover image is required';
    if (exteriorUrls.length < 1) newErrors.exterior = 'At least 1 exterior image is required';
    if (roomUrls.length < 3) newErrors.room = 'At least 3 room images are required';

    // Room config validation
    if (typeof totalRooms !== 'number' || totalRooms < 1) {
      newErrors.roomConfig = 'Enter the total number of rooms (at least 1)';
    } else if (roomTypes.length < 1) {
      newErrors.roomConfig = 'Add at least one room type';
    } else if (
      roomTypes.some(t => !t.name.trim() || !t.quantity || t.quantity < 1)
    ) {
      newErrors.roomConfig = 'Each room type needs a name and at least 1 room';
    } else if (allocatedRooms !== totalRooms) {
      newErrors.roomConfig = `Room type totals (${allocatedRooms}) must equal total rooms (${totalRooms})`;
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setPropertyImages({
      coverImages: coverUrls,
      exteriorImages: exteriorUrls,
      roomImages: roomUrls,
      roomConfig: buildRoomConfig(),
    });
    onContinue?.();
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property &amp; Rooms</h2>
        <p className="text-slate-600">
          Upload high-quality images of your property and configure your
          hotel&apos;s rooms. A minimum of 5 images is required to submit your
          listing.
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
            key={`cover-${coverUrls.length}`}
            label="Cover Image"
            isLarge
            helperText="JPG or PNG (max. 10MB)"
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={1}
            onFilesChange={files => uploadZone(files, 'cover')}
            isUploading={uploading.cover}
            error={errors.cover}
            existingUrls={coverUrls}
            onRemoveExisting={i => removeImage('cover', i)}
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
            key={`exterior-${exteriorUrls.length}`}
            label="Exterior Image"
            helperText="JPG or PNG (max. 10MB)"
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={1}
            onFilesChange={files => uploadZone(files, 'exterior')}
            isUploading={uploading.exterior}
            error={errors.exterior}
            existingUrls={exteriorUrls}
            onRemoveExisting={i => removeImage('exterior', i)}
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
            key={`room-${roomUrls.length}`}
            label="Room Images"
            helperText="Bedroom, Bathroom, etc."
            accept=".jpg,.jpeg,.png"
            multiple
            minFiles={3}
            onFilesChange={files => uploadZone(files, 'room')}
            isUploading={uploading.room}
            error={errors.room}
            existingUrls={roomUrls}
            onRemoveExisting={i => removeImage('room', i)}
          />
        </div>

        {/* 4. Room Configuration */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div className="p-2 bg-role-partner-light/40 rounded-lg">
              <Hotel className="w-5 h-5 text-role-partner-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              4. Room Configuration <span className="text-red-500">*</span>
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            Tell us how many rooms your hotel has and break them down into room
            types.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="totalRooms">
                Total Number of Rooms <span className="text-red-500">*</span>
              </Label>
              <Input
                id="totalRooms"
                type="number"
                min={1}
                placeholder="e.g. 40"
                className="h-11 border-slate-200"
                value={totalRooms}
                onChange={e =>
                  setTotalRooms(
                    e.target.value === '' ? '' : e.target.valueAsNumber,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Rooms Allocated</Label>
              <div
                className={cn(
                  'h-11 flex items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
                  allocationMatches
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                <BedDouble className="w-4 h-4 shrink-0" />
                <span>
                  {allocatedRooms} / {Number(totalRooms) || 0} rooms allocated
                </span>
                {!allocationMatches && (
                  <span className="ml-auto text-xs font-normal">
                    Must match total
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Room Types <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-slate-500">
                {roomTypes.length} type{roomTypes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {roomTypes.map((type, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 sm:items-center bg-slate-50/60 border border-slate-200 rounded-xl p-3"
              >
                <Input
                  placeholder={`Room type name (e.g. ${
                    index === 0 ? 'Deluxe Double' : 'Standard Twin'
                  })`}
                  className="h-10 bg-white border-slate-200 flex-1"
                  value={type.name}
                  onChange={e => updateRoomType(index, { name: e.target.value })}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Rooms"
                  className="h-10 bg-white border-slate-200 w-full sm:w-40"
                  value={type.quantity}
                  onChange={e =>
                    updateRoomType(index, {
                      quantity:
                        e.target.value === '' ? '' : e.target.valueAsNumber,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRoomType(index)}
                  disabled={roomTypes.length <= 1}
                  className="h-10 w-10 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Remove room type"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addRoomType}
              className="h-10 border-dashed border-slate-300 text-slate-600 hover:border-role-partner-primary hover:text-role-partner-primary hover:bg-role-partner-light/20 w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Room Type
            </Button>

            {errors.roomConfig && (
              <p className="text-sm text-red-500">{errors.roomConfig}</p>
            )}
          </div>
        </div>

        {errors.general && (
          <p className="text-sm text-red-500 text-center">{errors.general}</p>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isAnyUploading}
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
              disabled={isAnyUploading}
              className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer"
            >
              {isAnyUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
