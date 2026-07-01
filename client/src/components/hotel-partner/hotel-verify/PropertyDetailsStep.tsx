import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { FileUploadDropzone } from '@/components/ui/file-upload';
import { propertyDetailsSchema, type PropertyDetailsFormValues } from '@/validations/hotel-verify.validation';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';
import { toDateInputValue } from '@/utils/formatDate';

/** Hôm nay (YYYY-MM-DD) — chặn chọn ngày cấp phép trong tương lai. */
const TODAY = toDateInputValue(new Date());

export function PropertyDetailsStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setBusinessLicense, draft } = useHotelVerifyStore();
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PropertyDetailsFormValues>({
    resolver: zodResolver(propertyDetailsSchema),
    defaultValues: draft.businessLicense ?? {
      licenseNumber: '',
      issueDate: '',
      expiryDate: '',
      authority: '',
      status: 'active',
      documentFileUrl: '',
    },
  });

  // URL tài liệu đã upload (giữ trong draft) — hiển thị lại sau reload.
  const documentFileUrl = watch('documentFileUrl');
  const issueDate = watch('issueDate');

  const handleDocumentFileChange = async (files: File[]) => {
    if (files.length === 0) return;
    setDocUploading(true);
    setDocUploadError(null);
    try {
      const url = await hotelVerifyService.uploadFile(files[0]);
      setValue('documentFileUrl', url, { shouldValidate: true });
      // Lưu ngay vào draft để reload không mất, kể cả khi chưa bấm Continue.
      setBusinessLicense(getValues());
    } catch {
      setDocUploadError('Upload failed. Please try again.');
    } finally {
      setDocUploading(false);
    }
  };

  const handleRemoveDocument = () => {
    setValue('documentFileUrl', '', { shouldValidate: true });
    setBusinessLicense(getValues());
  };

  const onSubmit = (data: PropertyDetailsFormValues) => {
    setBusinessLicense(data);
    onContinue?.();
  };

  const isPending = isSubmitting || docUploading;

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Business License</h2>
        <p className="text-slate-600">Provide your legal business documentation and licensing details.</p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden field — value set via setValue after upload */}
        <input type="hidden" {...register('documentFileUrl')} />

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">
            Business License Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="licenseNumber"
            placeholder="e.g. 1234567890"
            className="h-11 border-slate-200"
            {...register('licenseNumber')}
          />
          {errors.licenseNumber && (
            <span className="text-xs text-red-500">{errors.licenseNumber.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="issueDate">
              License Issue Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="issueDate"
              render={({ field }) => (
                <DatePicker
                  id="issueDate"
                  value={field.value}
                  onChange={field.onChange}
                  max={TODAY}
                  placeholder="Chọn ngày cấp"
                  ariaInvalid={!!errors.issueDate}
                />
              )}
            />
            {errors.issueDate && (
              <span className="text-xs text-red-500">{errors.issueDate.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">License Expiry Date</Label>
            <Controller
              control={control}
              name="expiryDate"
              render={({ field }) => (
                <DatePicker
                  id="expiryDate"
                  value={field.value}
                  onChange={field.onChange}
                  min={issueDate || undefined}
                  placeholder="Chọn ngày hết hạn"
                  ariaInvalid={!!errors.expiryDate}
                />
              )}
            />
            {errors.expiryDate && (
              <span className="text-xs text-red-500">{errors.expiryDate.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="authority">
              Issuing Authority <span className="text-red-500">*</span>
            </Label>
            <Input
              id="authority"
              placeholder="e.g. Department of Planning and Investment"
              className="h-11 border-slate-200"
              {...register('authority')}
            />
            {errors.authority && (
              <span className="text-xs text-red-500">{errors.authority.message}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              License Status <span className="text-red-500">*</span>
            </Label>
            <Select
              defaultValue={draft.businessLicense?.status ?? 'active'}
              onValueChange={(val) =>
                setValue('status', val as PropertyDetailsFormValues['status'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Renewal</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <span className="text-xs text-red-500">{errors.status.message}</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <FileUploadDropzone
            key={documentFileUrl || 'empty'}
            label="Business License Document"
            helperText="SVG, PNG, JPG or PDF (max. 5MB)"
            accept=".pdf,.jpg,.jpeg,.png"
            onFilesChange={handleDocumentFileChange}
            isUploading={docUploading}
            error={docUploadError ?? errors.documentFileUrl?.message}
            existingUrls={documentFileUrl ? [documentFileUrl] : []}
            onRemoveExisting={handleRemoveDocument}
          />
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setBusinessLicense(getValues()); onBack?.(); }}
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
              disabled={isPending}
              className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
