import { useRef, useState } from 'react';
import { Loader2, Star, Trash2, UploadCloud, ImageIcon, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { useUpload } from '@/hooks/use-upload';
import {
  useAddHotelImages,
  useDeleteHotelImage,
  useSetPrimaryHotelImage,
} from '@/hooks/hotels';
import { errorMessage } from '@/utils/errorMessage';
import type { HotelImageInput } from '@/types/hotel.types';
import type { ManagedHotel } from '@/types/hotel-management.types';

interface HotelImagesModalProps {
  open: boolean;
  onClose: () => void;
  hotel: ManagedHotel;
}

type Category = 'cover' | 'exterior' | 'room';

interface PendingImage {
  url: string;
  isPrimary: boolean;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'cover', label: 'Cover' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'room', label: 'Room' },
];

export function HotelImagesModal({ open, onClose, hotel }: HotelImagesModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>('cover');
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const upload = useUpload();
  const addImages = useAddHotelImages(hotel.id);
  const deleteImage = useDeleteHotelImage(hotel.id);
  const setPrimary = useSetPrimaryHotelImage(hotel.id);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(file => upload.mutateAsync({ file, folder: 'properties' }))
      );
      setPending(prev => [
        ...prev,
        ...uploaded.map((res, i) => ({
          url: res.url,
          isPrimary: prev.length === 0 && i === 0 && hotel.images.length === 0,
        })),
      ]);
    } catch {
      toast.error('Failed to upload images');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const markPendingPrimary = (url: string) =>
    setPending(prev => prev.map(p => ({ ...p, isPrimary: p.url === url })));

  const removePending = (url: string) =>
    setPending(prev => prev.filter(p => p.url !== url));

  const handleAdd = async () => {
    if (pending.length === 0) return;
    try {
      const images: HotelImageInput[] = pending.map((p, i) => ({
        url: p.url,
        imageCategory: category,
        isPrimary: p.isPrimary,
        sortOrder: hotel.images.length + i,
      }));
      await addImages.mutateAsync({ images });
      toast.success('Photos added');
      setPending([]);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to add photos'));
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await setPrimary.mutateAsync(imageId);
      toast.success('Primary photo updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update primary photo'));
    }
  };

  const handleDelete = async () => {
    if (!deletingImageId) return;
    try {
      await deleteImage.mutateAsync(deletingImageId);
      toast.success('Photo deleted');
      setDeletingImageId(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete photo'));
    }
  };

  const handleClose = () => {
    setPending([]);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Manage hotel photos"
        description={hotel.name}
        icon={ImageIcon}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleClose} disabled={addImages.isPending}>
              Close
            </Button>
            <Button
              onClick={handleAdd}
              disabled={pending.length === 0 || addImages.isPending}
              className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
            >
              {addImages.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Add {pending.length > 0 ? `(${pending.length}) ` : ''}photos
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Existing photos */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Current photos ({hotel.images.length})
            </p>
            {hotel.images.length === 0 ? (
              <p className="text-sm italic text-slate-400">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {hotel.images.map(img => (
                  <div
                    key={img.id}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                  >
                    <img src={img.url} alt={img.caption ?? ''} className="h-full w-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-2.5 w-2.5 fill-white" /> Primary
                      </span>
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium capitalize text-white">
                      {img.imageCategory}
                    </span>
                    {/* Hover actions (always visible on touch via active state) */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100 focus-within:opacity-100">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          disabled={setPrimary.isPending}
                          title="Set as primary"
                          className="rounded-lg bg-white/90 p-1.5 text-amber-600 hover:bg-white disabled:opacity-50"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingImageId(img.id)}
                        title="Delete photo"
                        className="rounded-lg bg-white/90 p-1.5 text-red-600 hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category selector + upload */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Add new photos</p>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    category === c.value
                      ? 'border-role-partner-primary bg-role-partner-light text-role-partner-primary'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 transition-colors hover:border-role-partner-primary/50"
            >
              {upload.isPending ? (
                <Loader2 className="h-7 w-7 animate-spin text-role-partner-primary" />
              ) : (
                <UploadCloud className="h-7 w-7 text-slate-400" />
              )}
              <span className="text-sm text-slate-500">
                {upload.isPending
                  ? 'Uploading...'
                  : `Click to select "${category}" photos (multiple allowed)`}
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Pending photos */}
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Photos to add ({pending.length}) · category:{' '}
                <span className="capitalize text-role-partner-primary">{category}</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {pending.map(p => (
                  <div
                    key={p.url}
                    className={cn(
                      'group relative aspect-video overflow-hidden rounded-lg border-2 bg-slate-100',
                      p.isPrimary ? 'border-amber-500' : 'border-transparent'
                    )}
                  >
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => markPendingPrimary(p.url)}
                        title="Set as primary"
                        className="rounded-lg bg-white/90 p-1.5 text-amber-600 hover:bg-white"
                      >
                        <Star className={cn('h-4 w-4', p.isPrimary && 'fill-amber-500')} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePending(p.url)}
                        title="Remove"
                        className="rounded-lg bg-white/90 p-1.5 text-red-600 hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {p.isPrimary && (
                      <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-2.5 w-2.5 fill-white" /> Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && hotel.images.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ImagePlus className="h-4 w-4" />
              Photos are uploaded first; the primary photo becomes the hotel cover.
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deletingImageId}
        onClose={() => setDeletingImageId(null)}
        onConfirm={handleDelete}
        title="Delete photo"
        message="Delete this photo? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleteImage.isPending}
      />
    </>
  );
}
