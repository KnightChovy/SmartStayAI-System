import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Archive,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  Folder,
  FolderPlus,
  Link2,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpload } from '@/hooks/use-upload';
import { useAdminFiles } from '@/hooks/admin-tools';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';

interface AdminFileManagerModalProps {
  currentTime: Date;
  onClose: () => void;
}

const ALL_CATEGORY = 'all';

const BUILT_IN_CATEGORIES: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'photos', label: 'Photos', icon: FileImage },
  { id: 'archive', label: 'Archive', icon: Archive },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function getFileVisual(name: string): { icon: LucideIcon; color: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return { icon: FileImage, color: 'text-blue-500' };
  }
  if (['csv', 'xlsx', 'xls'].includes(ext)) {
    return { icon: FileSpreadsheet, color: 'text-emerald-500' };
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return { icon: Archive, color: 'text-amber-500' };
  }
  return { icon: FileText, color: 'text-red-500' };
}

export function AdminFileManagerModal({ onClose }: AdminFileManagerModalProps) {
  const { files, folders, addFile, addFolder, removeFile } = useAdminFiles();
  const upload = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const allCategories = [
    ...BUILT_IN_CATEGORIES,
    ...folders.map(name => ({ id: name, label: name, icon: Folder })),
  ];

  const countFor = (categoryId: string) =>
    files.filter(file => file.category === categoryId).length;

  const visibleFiles = files
    .filter(
      file =>
        activeCategory === ALL_CATEGORY || file.category === activeCategory
    )
    .filter(file =>
      file.name.toLowerCase().includes(search.trim().toLowerCase())
    );

  const activeLabel =
    activeCategory === ALL_CATEGORY
      ? 'All Files'
      : (allCategories.find(category => category.id === activeCategory)
          ?.label ?? activeCategory);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length === 0) return;

    const category =
      activeCategory === ALL_CATEGORY ? 'documents' : activeCategory;

    for (const file of selected) {
      try {
        const result = await upload.mutateAsync({
          file,
          folder: 'admin-files',
        });
        addFile(file.name, result.url, file.size, category);
      } catch (err) {
        toast.error(errorMessage(err, `Could not upload "${file.name}".`));
        return;
      }
    }
    toast.success(`${selected.length} file(s) uploaded`);
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleRemove = (id: string, name: string) => {
    removeFile(id);
    toast.success(
      `"${name}" removed from the list (file itself stays on storage)`
    );
  };

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

      <input
        className="hidden"
        multiple
        onChange={event => void handleFilesSelected(event)}
        ref={fileInputRef}
        type="file"
      />

      <section className="relative z-10 grid h-[min(82vh,640px)] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-outline-variant/40 bg-slate-50/80 p-4 md:block">
          <nav className="space-y-2">
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors',
                activeCategory === ALL_CATEGORY
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              )}
              onClick={() => setActiveCategory(ALL_CATEGORY)}
              type="button"
            >
              <FileText className="size-4" />
              All Files
            </button>
            {allCategories.map(category => {
              const Icon = category.icon;

              return (
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition-colors',
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  )}
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  <span className="truncate">{category.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">File Manager</h2>
              <span className="hidden text-xs font-bold text-slate-400 sm:inline">
                Home
              </span>
              <span className="hidden text-xs font-bold text-slate-400 sm:inline">
                &gt;
              </span>
              <span className="hidden text-xs font-bold text-slate-700 sm:inline">
                {activeLabel}
              </span>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <div className="relative hidden min-w-0 max-w-56 flex-1 sm:block">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-full bg-slate-50 pl-9 text-xs"
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search files..."
                  value={search}
                />
              </div>
              <button
                className="hidden h-9 items-center gap-2 rounded-full border border-outline-variant/50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 lg:inline-flex"
                onClick={() => setIsCreatingFolder(true)}
                type="button"
              >
                <FolderPlus className="size-4" />
                New Folder
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={upload.isPending}
                onClick={handleUploadClick}
                type="button"
              >
                {upload.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
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
            {isCreatingFolder && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-slate-50 p-3">
                <Input
                  autoFocus
                  className="h-9 flex-1 bg-white"
                  onChange={event => setNewFolderName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') handleCreateFolder();
                  }}
                  placeholder="Folder name"
                  value={newFolderName}
                />
                <button
                  className="h-9 rounded-full bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!newFolderName.trim()}
                  onClick={handleCreateFolder}
                  type="button"
                >
                  Create
                </button>
                <button
                  className="h-9 rounded-full border border-outline-variant/50 px-4 text-xs font-bold text-slate-700 hover:bg-white"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            )}

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Folders
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {allCategories.map(category => {
                const Icon = category.icon;

                return (
                  <button
                    className={cn(
                      'rounded-[28px] border p-4 text-left transition-colors hover:border-blue-100 hover:bg-blue-50/50',
                      activeCategory === category.id
                        ? 'border-blue-200 bg-blue-50/60'
                        : 'border-outline-variant/40 bg-white'
                    )}
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    type="button"
                  >
                    <Icon className="size-5 text-amber-500" />
                    <p className="mt-3 truncate text-sm font-bold text-slate-950">
                      {category.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {countFor(category.id)} file
                      {countFor(category.id) === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {activeCategory === ALL_CATEGORY
                  ? 'Recent Files'
                  : `Files in ${activeLabel}`}
              </p>
              {visibleFiles.length === 0 ? (
                <p className="mt-3 py-6 text-center text-sm text-muted-foreground">
                  {files.length === 0
                    ? 'No files uploaded yet — click Upload to add one.'
                    : 'No files match this view.'}
                </p>
              ) : (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-140 text-left">
                      <thead className="bg-slate-50/90">
                        <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          <th className="py-3.5 pl-4 pr-4">Name</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">Uploaded</th>
                          <th className="py-3 pl-4 pr-4 text-right"> </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visibleFiles.map(file => {
                          const visual = getFileVisual(file.name);
                          const Icon = visual.icon;

                          return (
                            <tr
                              className="transition-colors duration-200 hover:bg-indigo-50/35"
                              key={file.id}
                            >
                              <td className="py-4 pl-4 pr-4">
                                <a
                                  className="flex items-center gap-3 hover:underline"
                                  href={file.url}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <Icon
                                    className={cn(
                                      'size-4 shrink-0',
                                      visual.color
                                    )}
                                  />
                                  <span className="truncate text-sm font-bold text-slate-950">
                                    {file.name}
                                  </span>
                                </a>
                              </td>
                              <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                                {formatBytes(file.size)}
                              </td>
                              <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                                {formatDateShort(file.uploadedAt)}
                              </td>
                              <td className="py-4 pl-4 pr-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      aria-label={`More actions for ${file.name}`}
                                      className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                                      type="button"
                                    >
                                      <MoreVertical className="size-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-44"
                                  >
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={file.url}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        <ExternalLink className="size-3.5" />{' '}
                                        Open
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        void handleCopyLink(file.url)
                                      }
                                    >
                                      <Link2 className="size-3.5" /> Copy link
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        handleRemove(file.id, file.name)
                                      }
                                      variant="destructive"
                                    >
                                      <Trash2 className="size-3.5" /> Remove
                                      from list
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
