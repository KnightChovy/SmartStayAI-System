import { useRef, useState } from 'react';
import { Loader2, ImagePlus, Star, Trash2, UploadCloud, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { useUpload } from '@/hooks/use-upload';
import { useAddRoomTypeImages } from '@/hooks/hotel-management';
import type { ManagedRoomType } from '@/types/hotel-management.types';

interface RoomTypeImagesModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomType: ManagedRoomType;
}

interface PendingImage {
  url: string;
  isPrimary: boolean;
}

export function RoomTypeImagesModal({ open, onClose, hotelId, roomType }: RoomTypeImagesModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const upload = useUpload();
  const addImages = useAddRoomTypeImages(hotelId);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(file => upload.mutateAsync({ file, folder: 'room-types' }))
      );
      setPending(prev => [
        ...prev,
        ...uploaded.map((res, i) => ({
          url: res.url,
          // first image becomes primary when there are no images yet (old or new)
          isPrimary: prev.length === 0 && i === 0 && roomType.images.length === 0,
        })),
      ]);
    } catch {
      toast.error('Failed to upload images');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const setPrimary = (url: string) => {
    setPending(prev => prev.map(p => ({ ...p, isPrimary: p.url === url })));
  };

  const removePending = (url: string) => {
    setPending(prev => prev.filter(p => p.url !== url));
  };

  const handleSubmit = async () => {
    if (pending.length === 0) return;
    try {
      await addImages.mutateAsync({
        roomTypeId: roomType.id,
        dto: {
          images: pending.map((p, i) => ({ url: p.url, isPrimary: p.isPrimary, sortOrder: i })),
        },
      });
      toast.success('Images added');
      setPending([]);
      onClose();
    } catch {
      toast.error('Failed to add images');
    }
  };

  const handleClose = () => {
    setPending([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Manage room type images"
      description={roomType.name}
      icon={ImageIcon}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={addImages.isPending}>
            Close
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending.length === 0 || addImages.isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {addImages.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Add {pending.length > 0 ? `(${pending.length})` : ''} images
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Existing images */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            Current images ({roomType.images.length})
          </p>
          {roomType.images.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No images yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {roomType.images.map(img => (
                <div
                  key={img.id}
                  className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5 fill-white" /> Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Add new images</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-role-partner-primary/50 bg-slate-50 py-8 transition-colors"
          >
            {upload.isPending ? (
              <Loader2 className="w-7 h-7 text-role-partner-primary animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 text-slate-400" />
            )}
            <span className="text-sm text-slate-500">
              {upload.isPending ? 'Uploading...' : 'Click to select images (multiple allowed)'}
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

        {/* Pending images */}
        {pending.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Images to add ({pending.length}) — pick one as the primary image
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {pending.map(p => (
                <div
                  key={p.url}
                  className={cn(
                    'relative aspect-video rounded-lg overflow-hidden border-2 bg-slate-100 group',
                    p.isPrimary ? 'border-amber-500' : 'border-transparent'
                  )}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPrimary(p.url)}
                      title="Set as primary image"
                      className="p-1.5 rounded-lg bg-white/90 text-amber-600 hover:bg-white"
                    >
                      <Star className={cn('w-4 h-4', p.isPrimary && 'fill-amber-500')} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePending(p.url)}
                      title="Remove"
                      className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {p.isPrimary && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5 fill-white" /> Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && roomType.images.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ImagePlus className="w-4 h-4" />
            Images must be uploaded first; the primary image becomes the room type cover.
          </div>
        )}
      </div>
    </Modal>
  );
}
