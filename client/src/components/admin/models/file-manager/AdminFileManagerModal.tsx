import { useEffect } from 'react';
import {
  Archive,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  Folder,
  FolderPlus,
  MoreVertical,
  Search,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { formatDate, formatTime } from '@/utils/formatDate';

interface AdminFileManagerModalProps {
  currentTime: Date;
  onClose: () => void;
}

const categories = [
  { icon: FileText, label: 'Documents', active: true },
  { icon: Download, label: 'Downloads', active: false },
  { icon: FileImage, label: 'Photos', active: false },
  { icon: Folder, label: 'Projects', active: false },
  { icon: Archive, label: 'Archive', active: false },
];

const folders = [
  { files: '12 files', label: 'Marketing' },
  { files: '8 files', label: 'Reports' },
  { files: '45 files', label: 'User Data' },
];

const files = [
  {
    color: 'text-red-500',
    icon: FileText,
    modified: 'Oct 24, 2023',
    name: 'invoice_oct.pdf',
    size: '1.2 MB',
  },
  {
    color: 'text-amber-500',
    icon: FileText,
    modified: 'Oct 22, 2023',
    name: 'project_plan.pptx',
    size: '4.5 MB',
  },
  {
    color: 'text-emerald-500',
    icon: FileSpreadsheet,
    modified: 'Oct 20, 2023',
    name: 'customer_list.csv',
    size: '850 KB',
  },
  {
    color: 'text-blue-500',
    icon: FileImage,
    modified: 'Oct 18, 2023',
    name: 'brand_logo.png',
    size: '2.1 MB',
  },
];

export function AdminFileManagerModal({
  currentTime,
  onClose,
}: AdminFileManagerModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Close file manager"
        className="absolute inset-0 h-full w-full"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 grid h-[min(82vh,640px)] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-outline-variant/40 bg-slate-50/80 p-4 md:block">
          <nav className="space-y-2">
            {categories.map(category => {
              const Icon = category.icon;

              return (
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors',
                    category.active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  )}
                  key={category.label}
                  type="button"
                >
                  <Icon className="size-4" />
                  {category.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">
                File Manager
              </h2>
              <span className="hidden text-xs font-bold text-slate-400 sm:inline">
                Home
              </span>
              <span className="hidden text-xs font-bold text-slate-400 sm:inline">
                &gt;
              </span>
              <span className="hidden text-xs font-bold text-slate-700 sm:inline">
                Documents
              </span>
              <span className="hidden text-xs font-bold text-blue-600 lg:inline">
                Synced {formatTime(currentTime)}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <div className="relative hidden min-w-0 max-w-56 flex-1 sm:block">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-full bg-slate-50 pl-9 text-xs"
                  placeholder="Search files..."
                />
              </div>
              <button
                className="hidden h-9 items-center gap-2 rounded-full border border-outline-variant/50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 lg:inline-flex"
                type="button"
              >
                <FolderPlus className="size-4" />
                New Folder
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                type="button"
              >
                <FileUp className="size-4" />
                Upload
              </button>
              <button
                aria-label="Close file manager"
                className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Folders
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {folders.map(folder => (
                <button
                  className="rounded-[28px] border border-outline-variant/40 bg-white p-4 text-left transition-colors hover:border-blue-100 hover:bg-blue-50/50"
                  key={folder.label}
                  type="button"
                >
                  <Folder className="size-5 text-amber-500" />
                  <p className="mt-3 text-sm font-bold text-slate-950">
                    {folder.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {folder.files}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Recent Files
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-140 text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <th className="py-3 pr-4">Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Last Modified</th>
                      <th className="py-3 pl-4 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map(file => {
                      const Icon = file.icon;

                      return (
                        <tr
                          className="border-b border-outline-variant/25 last:border-b-0"
                          key={file.name}
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Icon className={cn('size-4', file.color)} />
                              <span className="text-sm font-bold text-slate-950">
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                            {file.size}
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                            {file.name === 'invoice_oct.pdf'
                              ? `${formatDate(currentTime)} | ${formatTime(currentTime)}`
                              : file.modified}
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <button
                              aria-label={`More actions for ${file.name}`}
                              className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                              type="button"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
