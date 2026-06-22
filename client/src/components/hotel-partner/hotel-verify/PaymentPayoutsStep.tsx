import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Lock, Info, Landmark } from 'lucide-react';
import { paymentPayoutsSchema, type PaymentPayoutsFormValues } from '@/validations/hotel-verify.validation';
import { useHotelVerifyStore } from '@/stores/hotel-verify.store';

export function PaymentPayoutsStep({
  onBack,
  onContinue,
}: {
  onBack?: () => void;
  onContinue?: () => void;
}) {
  const { setPaymentPayouts, draft } = useHotelVerifyStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PaymentPayoutsFormValues>({
    resolver: zodResolver(paymentPayoutsSchema),
    defaultValues: draft.paymentPayouts ?? {
      bankAccount: {
        accountHolder: '',
        bankName: '',
        accountNumber: '',
        bankBranch: '',
        swiftCode: '',
      },
      taxInvoice: {
        taxIdVatNumber: '',
        registeredBusinessAddress: '',
      },
    },
  });

  const accountHolder = watch('bankAccount.accountHolder');
  const accountNumber = watch('bankAccount.accountNumber');
  const bankName = watch('bankAccount.bankName');

  const displayAccountNumber =
    accountNumber && accountNumber.length >= 4
      ? `•••• •••• ${accountNumber.slice(-4)}`
      : '•••• •••• 0000';
  const displayBankName = bankName || 'Pending';

  const onSubmit = (data: PaymentPayoutsFormValues) => {
    const ti = data.taxInvoice;
    setPaymentPayouts({
      bankAccount: data.bankAccount,
      taxInvoice: ti?.taxIdVatNumber ? ti : undefined,
    });
    onContinue?.();
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment &amp; Payouts</h2>
        <p className="text-slate-600">Configure how you'll receive funds and manage billing information.</p>
      </div>

      {/* Security Banner */}
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-4 flex gap-3 mb-8">
        <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1">Secure Financial Information</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            All payment data is encrypted using AES-256 and stored in compliance with PCI-DSS
            standards. Your banking details are strictly confidential.
          </p>
        </div>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bank Account Details */}
            <div className="border border-slate-200 rounded-xl p-6 shadow-sm bg-white">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Bank Account Details</h3>

              <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-3 flex gap-2.5 mb-6">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700">
                  Account holder name should match the hotel business owner or legal representative.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>
                    Account Holder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Nguyen Van A"
                    className="h-11 border-slate-200"
                    {...register('bankAccount.accountHolder')}
                  />
                  {errors.bankAccount?.accountHolder && (
                    <span className="text-xs text-red-500">
                      {errors.bankAccount.accountHolder.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    defaultValue={draft.paymentPayouts?.bankAccount.bankName}
                    onValueChange={(val) =>
                      setValue('bankAccount.bankName', val, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="h-11 border-slate-200 text-slate-700">
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vietcombank">Vietcombank</SelectItem>
                      <SelectItem value="Techcombank">Techcombank</SelectItem>
                      <SelectItem value="MB Bank">MB Bank</SelectItem>
                      <SelectItem value="ACB">ACB</SelectItem>
                      <SelectItem value="BIDV">BIDV</SelectItem>
                      <SelectItem value="VPBank">VPBank</SelectItem>
                      <SelectItem value="Sacombank">Sacombank</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.bankAccount?.bankName && (
                    <span className="text-xs text-red-500">
                      {errors.bankAccount.bankName.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="0000 0000 0000"
                    className="h-11 border-slate-200"
                    {...register('bankAccount.accountNumber')}
                  />
                  {errors.bankAccount?.accountNumber && (
                    <span className="text-xs text-red-500">
                      {errors.bankAccount.accountNumber.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Bank Branch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Branch name or code"
                    className="h-11 border-slate-200"
                    {...register('bankAccount.bankBranch')}
                  />
                  {errors.bankAccount?.bankBranch && (
                    <span className="text-xs text-red-500">
                      {errors.bankAccount.bankBranch.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <Label>Swift Code</Label>
                    <span className="text-xs text-slate-500">(Optional)</span>
                  </div>
                  <Input
                    placeholder="8 or 11 characters"
                    className="h-11 border-slate-200"
                    {...register('bankAccount.swiftCode')}
                  />
                </div>
              </div>
            </div>

            {/* Tax Invoice Info */}
            <div className="border border-slate-200 rounded-xl p-6 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice Info</h3>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                  Optional
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Provide tax details if you require formal invoices for platform fees.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Tax ID / VAT Number</Label>
                  <Input
                    placeholder="e.g. 0123456789"
                    className="h-11 border-slate-200"
                    {...register('taxInvoice.taxIdVatNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registered Business Address</Label>
                  <Input
                    placeholder="Full legal address"
                    className="h-11 border-slate-200"
                    {...register('taxInvoice.registeredBusinessAddress')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Payout Account Preview
            </h4>
            <div className="w-full aspect-[1.586/1] mx-auto bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl text-white border border-slate-700/50 relative overflow-hidden flex flex-col justify-between group transform transition-transform hover:scale-[1.02] duration-300">
              <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full blur-2xl sm:blur-3xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/10 rounded-full blur-xl sm:blur-2xl -ml-8 sm:-ml-10 -mb-8 sm:-mb-10 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <div className="font-bold text-[11px] sm:text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{displayBankName}</span>
                </div>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400/80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8.5 21.3C5.4 18 4 13.5 4.5 9.1" />
                  <path d="M13 21.8C9.5 17.5 8 11.5 9 6" />
                  <path d="M17.5 22.3C13.6 17 12 10.5 13.5 4.5" />
                  <path d="M22 22.8C18 16 16.5 9 18 3" />
                </svg>
              </div>

              <div className="relative z-10 space-y-1.5 sm:space-y-2.5">
                <div className="w-7 h-5 sm:w-9 sm:h-6 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-[3px] border border-yellow-500/50 opacity-90 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(0,0,0,0.1)_20%,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_75%,rgba(0,0,0,0.1)_75%,rgba(0,0,0,0.1)_80%,transparent_80%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_40%,rgba(0,0,0,0.1)_40%,rgba(0,0,0,0.1)_60%,transparent_60%)]" />
                </div>
                <p className="text-xs sm:text-sm md:text-base font-mono tracking-widest text-slate-100 drop-shadow-sm font-semibold truncate">
                  {displayAccountNumber}
                </p>
              </div>

              <div className="relative z-10 flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-widest font-semibold">
                    Account Holder
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-100 truncate max-w-[120px] sm:max-w-[160px] uppercase">
                    {accountHolder || 'YOUR NAME'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">
                    Primary
                  </span>
                  <div className="flex -space-x-1.5">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-red-500/80 mix-blend-screen" />
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-yellow-500/80 mix-blend-screen" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setPaymentPayouts(getValues()); onBack?.(); }}
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
              className="h-11 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white cursor-pointer"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
