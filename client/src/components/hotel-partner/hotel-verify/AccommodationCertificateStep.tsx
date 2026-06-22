import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { FileUploadDropzone } from '@/components/ui/file-upload';
import {
  accommodationCertificateSchema,
  type AccommodationCertificateFormValues,
} from '@/validations/hotel-verify.validation';
import { hotelVerifyService } from '@/services/hotel-verify.service';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';

type UploadState = { uploading: boolean; error: string | null };

function useUploadZone(
  fieldPath: string,
  setValue: (path: string, val: string, opts?: object) => void,
) {
  const [state, setState] = useState<UploadState>({ uploading: false, error: null });

  const handleChange = async (files: File[]) => {
    if (files.length === 0) {
      setValue(fieldPath, '', { shouldValidate: false });
      setState({ uploading: false, error: null });
      return;
    }
    setState({ uploading: true, error: null });
    try {
      const url = await hotelVerifyService.uploadFile(files[0]);
      setValue(fieldPath, url, { shouldValidate: true });
      setState({ uploading: false, error: null });
    } catch {
      setValue(fieldPath, '', { shouldValidate: true });
      setState({ uploading: false, error: 'Upload failed. Please try again.' });
    }
  };

  return { ...state, handleChange };
}

export function AccommodationCertificateStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setCertificates, draft } = useHotelVerifyStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AccommodationCertificateFormValues>({
    resolver: zodResolver(accommodationCertificateSchema),
    defaultValues: draft.certificates ?? {
      operatingLicense: { licenseNumber: '', issueDate: '', authority: '', documentFileUrl: '' },
      fireSafety: { certificateNumber: '', issueDate: '', documentFileUrl: '' },
      securityOrder: { certificateNumber: '', issueDate: '', documentFileUrl: '' },
      classification: { starRating: '', ratingCertificateFileUrl: '' },
    },
  });

  const setVal = (path: string, val: string, opts?: object) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(path as any, val, opts);

  const opLic = useUploadZone('operatingLicense.documentFileUrl', setVal);
  const fire = useUploadZone('fireSafety.documentFileUrl', setVal);
  const security = useUploadZone('securityOrder.documentFileUrl', setVal);
  const classification = useUploadZone('classification.ratingCertificateFileUrl', setVal);

  const onSubmit = (data: AccommodationCertificateFormValues) => {
    const so = data.securityOrder;
    const cl = data.classification;
    setCertificates({
      operatingLicense: data.operatingLicense,
      fireSafety: data.fireSafety,
      securityOrder: so?.certificateNumber ? so : undefined,
      classification: cl?.starRating ? cl : undefined,
    });
    onContinue?.();
  };

  const anyUploading = opLic.uploading || fire.uploading || security.uploading || classification.uploading;
  const isPending = isSubmitting || anyUploading;

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Accommodation Certificate</h2>
        <p className="text-slate-600">
          Provide your operating licenses and safety certificates to comply with local regulations.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full mb-8" />

      <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden URL fields */}
        <input type="hidden" {...register('operatingLicense.documentFileUrl')} />
        <input type="hidden" {...register('fireSafety.documentFileUrl')} />
        <input type="hidden" {...register('securityOrder.documentFileUrl')} />
        <input type="hidden" {...register('classification.ratingCertificateFileUrl')} />

        {/* 1. Accommodation Operating License */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Accommodation Operating License
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="opLicenseNumber">
                License Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opLicenseNumber"
                placeholder="e.g. 1234567890"
                className="h-11 border-slate-200"
                {...register('operatingLicense.licenseNumber')}
              />
              {errors.operatingLicense?.licenseNumber && (
                <span className="text-xs text-red-500">
                  {errors.operatingLicense.licenseNumber.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="opIssueDate">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opIssueDate"
                type="date"
                className="h-11 border-slate-200 text-slate-700"
                {...register('operatingLicense.issueDate')}
              />
              {errors.operatingLicense?.issueDate && (
                <span className="text-xs text-red-500">
                  {errors.operatingLicense.issueDate.message}
                </span>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="opAuthority">
                Issuing Authority <span className="text-red-500">*</span>
              </Label>
              <Input
                id="opAuthority"
                placeholder="e.g. Department of Tourism"
                className="h-11 border-slate-200"
                {...register('operatingLicense.authority')}
              />
              {errors.operatingLicense?.authority && (
                <span className="text-xs text-red-500">
                  {errors.operatingLicense.authority.message}
                </span>
              )}
            </div>
          </div>
          <FileUploadDropzone
            label="Upload Document"
            accept=".pdf,.jpg,.jpeg,.png"
            onFilesChange={opLic.handleChange}
            isUploading={opLic.uploading}
            error={opLic.error ?? errors.operatingLicense?.documentFileUrl?.message}
          />
        </div>

        {/* 2. Fire Safety Certificate (PCCC) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Fire Safety Certificate (PCCC)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fireCertNumber">
                Certificate Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fireCertNumber"
                placeholder="e.g. PCCC-2023-001"
                className="h-11 border-slate-200"
                {...register('fireSafety.certificateNumber')}
              />
              {errors.fireSafety?.certificateNumber && (
                <span className="text-xs text-red-500">
                  {errors.fireSafety.certificateNumber.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fireIssueDate">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fireIssueDate"
                type="date"
                className="h-11 border-slate-200 text-slate-700"
                {...register('fireSafety.issueDate')}
              />
              {errors.fireSafety?.issueDate && (
                <span className="text-xs text-red-500">
                  {errors.fireSafety.issueDate.message}
                </span>
              )}
            </div>
          </div>
          <FileUploadDropzone
            label="Upload Document"
            accept=".pdf,.jpg,.jpeg,.png"
            onFilesChange={fire.handleChange}
            isUploading={fire.uploading}
            error={fire.error ?? errors.fireSafety?.documentFileUrl?.message}
          />
        </div>

        {/* 3. Security & Order Certificate (ANTT) — optional */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>3. Security &amp; Order Certificate (ANTT)</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Optional
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="securityCertNumber">Certificate Number</Label>
              <Input
                id="securityCertNumber"
                placeholder="e.g. ANTT-2023-001"
                className="h-11 border-slate-200"
                {...register('securityOrder.certificateNumber')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityIssueDate">Issue Date</Label>
              <Input
                id="securityIssueDate"
                type="date"
                className="h-11 border-slate-200 text-slate-700"
                {...register('securityOrder.issueDate')}
              />
            </div>
          </div>
          <FileUploadDropzone
            label="Upload Document"
            accept=".pdf,.jpg,.jpeg,.png"
            onFilesChange={security.handleChange}
            isUploading={security.uploading}
            error={security.error ?? undefined}
          />
        </div>

        {/* 4. Hotel Classification — optional */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>4. Hotel Classification</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Optional
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Star Rating</Label>
              <Select
                defaultValue={draft.certificates?.classification?.starRating}
                onValueChange={(val) =>
                  setValue('classification.starRating' as never, val as never, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 w-full border-slate-200 text-slate-700">
                  <SelectValue placeholder="Select star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="unrated">Unrated / Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <FileUploadDropzone
            label="Rating Certificate"
            accept=".pdf,.jpg,.jpeg,.png"
            onFilesChange={classification.handleChange}
            isUploading={classification.uploading}
            error={classification.error ?? undefined}
          />
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setCertificates(getValues()); onBack?.(); }}
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
