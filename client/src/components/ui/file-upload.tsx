import React, { useState, useCallback } from 'react';
import { UploadCloud, X, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FileUploadDropzoneProps {
  label: string;
  multiple?: boolean;
  accept?: string;
  helperText?: string;
  isLarge?: boolean;
  minFiles?: number;
  onFilesChange?: (files: File[]) => void;
  error?: string;
  isUploading?: boolean;
}

export function FileUploadDropzone({
  label,
  multiple = false,
  accept = '*',
  helperText,
  isLarge = false,
  minFiles,
  onFilesChange,
  error,
  isUploading = false,
}: FileUploadDropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateFiles = useCallback(
    (newFiles: File[]) => {
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    },
    [onFilesChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        updateFiles(multiple ? [...files, ...droppedFiles] : [droppedFiles[0]]);
      }
    },
    [multiple, files, updateFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        updateFiles(multiple ? [...files, ...selectedFiles] : [selectedFiles[0]]);
      }
    },
    [multiple, files, updateFiles],
  );

  const removeFile = (indexToRemove: number) => {
    updateFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const isImage = (file: File) => file.type.startsWith('image/');

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold text-slate-900">{label}</Label>
        {minFiles && files.length < minFiles && (
          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Min {minFiles} required ({files.length}/{minFiles})
          </span>
        )}
      </div>

      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group overflow-hidden',
          isLarge ? 'h-64' : 'h-32',
          isDragging
            ? 'border-role-partner-primary bg-role-partner-primary/5'
            : error
              ? 'border-red-400'
              : 'border-slate-300',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          title=""
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-role-partner-primary" />
        ) : (
          <>
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-role-partner-primary" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Click or drag file{multiple ? 's' : ''} to this area to upload
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {helperText || 'Support for a single or bulk upload.'}
            </p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg shadow-sm relative pr-8 group"
            >
              {isImage(file) ? (
                <div className="w-10 h-10 shrink-0 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                  <File className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
