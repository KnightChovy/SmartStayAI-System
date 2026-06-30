import { Hammer } from 'lucide-react';

interface ComingSoonPageProps {
  /** Tên tính năng hiển thị (vd "Revenue"). */
  title?: string;
  description?: string;
}

/** Placeholder cho các trang đã có trong menu nhưng chưa làm — tránh link chết / 404. */
export default function ComingSoonPage({
  title = 'This feature',
  description = 'Tính năng này đang được phát triển và sẽ sớm ra mắt.',
}: ComingSoonPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-role-partner-light text-role-partner-primary">
        <Hammer className="size-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-slate-900">{title} — Coming soon</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
