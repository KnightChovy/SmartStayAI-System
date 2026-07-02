/** Trạng thái rỗng cho một khối nhỏ (Top Hotels / Top Cities). */
export function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-slate-400">{label}</div>
  );
}
