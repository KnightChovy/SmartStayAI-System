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
import { representativeSchema, type RepresentativeFormValues } from '@/validations/hotel-verify.validation';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';
import { toDateInputValue } from '@/utils/formatDate';

// Người đại diện phải đủ 18 tuổi và không quá 120 tuổi.
const now = new Date();
const MAX_DOB = toDateInputValue(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()));
const MIN_DOB = toDateInputValue(new Date(now.getFullYear() - 120, 0, 1));

export function RepresentativeVerificationStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setRepresentative, draft } = useHotelVerifyStore();
  const [frontUploading, setFrontUploading] = useState(false);
  const [backUploading, setBackUploading] = useState(false);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RepresentativeFormValues>({
    resolver: zodResolver(representativeSchema),
    defaultValues: draft.representative ?? {
      fullName: '',
      role: undefined,
      dob: '',
      idNumber: '',
      phone: '',
      address: '',
      idFrontImageUrl: '',
      idBackImageUrl: '',
    },
  });

  // URL ảnh CMND/CCCD đã upload (giữ trong draft) — hiển thị lại sau reload.
  const idFrontImageUrl = watch('idFrontImageUrl');
  const idBackImageUrl = watch('idBackImageUrl');

  const handleFrontImageChange = async (files: File[]) => {
    if (files.length === 0) return;
    setFrontUploading(true);
    setFrontError(null);
    try {
      const url = await hotelVerifyService.uploadFile(files[0]);
      setValue('idFrontImageUrl', url, { shouldValidate: true });
      setRepresentative(getValues());
    } catch {
      setFrontError('Upload failed. Please try again.');
    } finally {
      setFrontUploading(false);
    }
  };

  const handleBackImageChange = async (files: File[]) => {
    if (files.length === 0) return;
    setBackUploading(true);
    setBackError(null);
    try {
      const url = await hotelVerifyService.uploadFile(files[0]);
      setValue('idBackImageUrl', url, { shouldValidate: true });
      setRepresentative(getValues());
    } catch {
      setBackError('Upload failed. Please try again.');
    } finally {
      setBackUploading(false);
    }
  };

  const handleRemoveFront = () => {
    setValue('idFrontImageUrl', '', { shouldValidate: true });
    setRepresentative(getValues());
  };

  const handleRemoveBack = () => {
    setValue('idBackImageUrl', '', { shouldValidate: true });
    setRepresentative(getValues());
  };

  const onSubmit = (data: RepresentativeFormValues) => {
    setRepresentative(data);
    onContinue?.();
  };

  const isPending = isSubmitting || frontUploading || backUploading;

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Representative Verification</h2>
        <p className="text-slate-600">
          Provide the personal details and identity documents of the legal representative.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden URL fields */}
        <input type="hidden" {...register('idFrontImageUrl')} />
        <input type="hidden" {...register('idBackImageUrl')} />

        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Personal Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">
                Representative Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Nguyen Van A"
                className="h-11 border-slate-200"
                {...register('fullName')}
              />
              {errors.fullName && (
                <span className="text-xs text-red-500">{errors.fullName.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={draft.representative?.role}
                onValueChange={(val) =>
                  setValue('role', val as RepresentativeFormValues['role'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="general_manager">General Manager</SelectItem>
                  <SelectItem value="legal_representative">Legal Representative</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <span className="text-xs text-red-500">{errors.role.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="dob"
                render={({ field }) => (
                  <DatePicker
                    id="dob"
                    value={field.value}
                    onChange={field.onChange}
                    min={MIN_DOB}
                    max={MAX_DOB}
                    placeholder="Chọn ngày sinh"
                    ariaInvalid={!!errors.dob}
                  />
                )}
              />
              {errors.dob && (
                <span className="text-xs text-red-500">{errors.dob.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">
                ID / Passport Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="idNumber"
                placeholder="9–12 digit number"
                className="h-11 border-slate-200"
                {...register('idNumber')}
              />
              {errors.idNumber && (
                <span className="text-xs text-red-500">{errors.idNumber.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repPhone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="repPhone"
                placeholder="+84 900 000 000"
                className="h-11 border-slate-200"
                {...register('phone')}
              />
              {errors.phone && (
                <span className="text-xs text-red-500">{errors.phone.message}</span>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="repAddress">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="repAddress"
                placeholder="Full residential address"
                className="h-11 border-slate-200"
                {...register('address')}
              />
              {errors.address && (
                <span className="text-xs text-red-500">{errors.address.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Identity Document */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Identity Document
          </h3>
          <p className="text-sm text-slate-500">
            Please upload clear photos of your ID Card or Passport. Make sure all details are
            readable.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FileUploadDropzone
                key={idFrontImageUrl || 'front-empty'}
                label="Image Front Side"
                accept=".jpg,.jpeg,.png"
                onFilesChange={handleFrontImageChange}
                isUploading={frontUploading}
                error={frontError ?? errors.idFrontImageUrl?.message}
                existingUrls={idFrontImageUrl ? [idFrontImageUrl] : []}
                onRemoveExisting={handleRemoveFront}
              />
            </div>
            <div>
              <FileUploadDropzone
                key={idBackImageUrl || 'back-empty'}
                label="Image Back Side"
                accept=".jpg,.jpeg,.png"
                onFilesChange={handleBackImageChange}
                isUploading={backUploading}
                error={backError ?? errors.idBackImageUrl?.message}
                existingUrls={idBackImageUrl ? [idBackImageUrl] : []}
                onRemoveExisting={handleRemoveBack}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setRepresentative(getValues()); onBack?.(); }}
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
