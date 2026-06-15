import { useState } from 'react';
import { ImagePlus, MessageSquareQuote, Plus, Star, X } from 'lucide-react';
import { useCreateReview, useMyReviews } from '@/hooks/account';
import StarRating from '@/components/shared/StarRating';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateShort } from '@/utils/formatDate';
import type { CreateReviewInput } from '@/types/account.types';

const EMPTY: CreateReviewInput = {
  hotelName: '',
  bookingCode: '',
  overallRating: 5,
  cleanlinessRating: 5,
  serviceRating: 5,
  locationRating: 5,
  valueRating: 5,
  title: '',
  content: '',
  images: [],
};

const SUBSCORES: { key: keyof CreateReviewInput; label: string }[] = [
  { key: 'cleanlinessRating', label: 'Cleanliness' },
  { key: 'serviceRating', label: 'Service' },
  { key: 'locationRating', label: 'Location' },
  { key: 'valueRating', label: 'Value' },
];

export default function MyReviewsPage() {
  const { data, isLoading } = useMyReviews();
  const createReview = useCreateReview();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateReviewInput>(EMPTY);
  const [imageUrl, setImageUrl] = useState('');

  const set = <K extends keyof CreateReviewInput>(key: K, value: CreateReviewInput[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addImage = () => {
    if (imageUrl.trim()) {
      set('images', [...form.images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReview.mutateAsync(form);
    setForm(EMPTY);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface">My reviews</h2>
        <Button className="bg-on-surface text-white hover:bg-primary" onClick={() => setOpen(o => !o)}>
          <Plus className="size-4" /> Write a review
        </Button>
      </div>

      {/* Create form */}
      {open && (
        <form
          onSubmit={submit}
          className="mt-5 space-y-4 rounded-2xl border border-outline-variant/30 bg-surface p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Hotel name</Label>
              <Input value={form.hotelName} onChange={e => set('hotelName', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Booking code</Label>
              <Input value={form.bookingCode} onChange={e => set('bookingCode', e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Overall rating</Label>
            <StarRating value={form.overallRating} editable size={28} onChange={v => set('overallRating', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SUBSCORES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                <span className="text-sm text-on-surface-variant">{label}</span>
                <StarRating
                  value={form[key] as number}
                  editable
                  size={18}
                  onChange={v => set(key, v as never)}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Sum up your stay" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Your review</Label>
            <textarea
              rows={4}
              required
              value={form.content}
              onChange={e => set('content', e.target.value)}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="What did you love? What could be better?"
            />
          </div>

          {/* Photos (mock: paste image URL) */}
          <div className="flex flex-col gap-1.5">
            <Label>Photos</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste image URL…"
              />
              <Button type="button" variant="outline" onClick={addImage}>
                <ImagePlus className="size-4" /> Add
              </Button>
            </div>
            {form.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative size-16 overflow-hidden rounded-lg border">
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-on-primary hover:bg-primary/90"
              disabled={createReview.isPending}
            >
              {createReview.isPending ? 'Publishing…' : 'Publish review'}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Share your experience after a completed stay."
          />
        ) : (
          data.map(r => (
            <div key={r.id} className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-be-vietnam font-semibold text-on-surface">{r.hotelName}</h3>
                <StarRating value={r.overallRating} size={16} />
              </div>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {r.bookingCode} · {formatDateShort(r.createdAt)}
              </p>
              {r.title && <p className="mt-2 font-medium text-on-surface">{r.title}</p>}
              <p className="mt-1 text-sm text-on-surface-variant">{r.content}</p>

              {r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((url, i) => (
                    <img key={i} src={url} alt="" className="size-20 rounded-lg border object-cover" />
                  ))}
                </div>
              )}

              {r.managerResponse && (
                <div className="mt-3 flex gap-2 rounded-xl bg-surface-container-low p-3">
                  <MessageSquareQuote className="size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-on-surface">Response from property</p>
                    <p className="text-sm text-on-surface-variant">{r.managerResponse}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
