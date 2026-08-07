import { useState } from 'react';
import { AlertTriangle, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { useUpdatePayoutAccount } from '@/hooks/hotel-revenue';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/utils/errorMessage';
import type { HotelPayoutAccountSummary } from '@/types/hotel-revenue.types';
import { maskAccount } from './payout-labels';

interface PayoutAccountModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  account: HotelPayoutAccountSummary | null | undefined;
  /** Có yêu cầu rút đang chờ duyệt ⇒ đổi tài khoản lúc này ảnh hưởng chính khoản đó. */
  hasPendingPayout: boolean;
}

const ACCOUNT_NUMBER_RE = /^\d{6,30}$/;

/**
 * Đổi/tạo tài khoản nhận tiền (`PUT /hotels/:id/payout-account`, owner-only).
 *
 * Cảnh báo quan trọng: BE **update tại chỗ** (giữ nguyên `id`) nên yêu cầu rút đang `pending`
 * không hỏng — nhưng Platform Manager sẽ chuyển tiền vào tài khoản **mới**. BE cố ý không chặn,
 * nên chỗ duy nhất nói được điều đó cho đối tác là màn hình này.
 */
export function PayoutAccountModal({
  open,
  onClose,
  hotelId,
  account,
  hasPendingPayout,
}: PayoutAccountModalProps) {
  const [accountHolder, setAccountHolder] = useState(account?.accountHolder ?? '');
  const [bankName, setBankName] = useState(account?.bankName ?? '');
  const [bankBranch, setBankBranch] = useState(account?.bankBranch ?? '');

  // BE chỉ giải mã số TK cho **chủ** khách sạn — mà modal này vốn owner-only, nên ở đây luôn có
  // số thật để điền lại (staff/manager không mở tới được).
  const savedNumber = account?.accountNumber ?? null;

  /**
   * Ô số TK mở ra là đã có **số cũ (đã che)** thay vì trống trơn: phần lớn lần vào đây là để sửa
   * tên chủ TK hoặc chi nhánh, bắt gõ lại 13 chữ số cho một thứ không đổi là chỗ dễ gõ sai nhất
   * form này.
   *
   * `null` = **chưa đụng vào** ⇒ đang hiện số cũ, và lúc lưu gửi lại `savedNumber` (số THẬT).
   * Nhờ vậy chuỗi che không bao giờ đi được vào payload — đúng rủi ro mà bản trước né bằng cách
   * để trống. Chạm vào ô là ô trống ngay để gõ số mới; rời ô mà chưa gõ gì thì số cũ hiện lại,
   * nên không bao giờ rơi vào trạng thái trống-không-hợp-lệ chỉ vì lỡ bấm vào.
   */
  const [numberDraft, setNumberDraft] = useState<string | null>(
    savedNumber ? null : ''
  );
  const [numberFocused, setNumberFocused] = useState(false);

  const untouchedNumber = numberDraft === null;
  const accountNumber = numberDraft ?? savedNumber ?? '';

  const update = useUpdatePayoutAccount(hotelId);

  const holderError =
    accountHolder.trim().length > 0 && accountHolder.trim().length < 2
      ? 'At least 2 characters'
      : null;
  const bankError =
    bankName.trim().length > 0 && bankName.trim().length < 2
      ? 'At least 2 characters'
      : null;
  // Cùng luật với BE (6–30 chữ số) để báo tại chỗ thay vì để đối tác bấm Lưu rồi ăn 400.
  // Chỉ soi khi đối tác ĐÃ tự gõ: số cũ là số BE đang lưu, bắt lỗi nó là vô nghĩa.
  const numberError =
    numberDraft !== null &&
    numberDraft.length > 0 &&
    !ACCOUNT_NUMBER_RE.test(numberDraft)
      ? 'Must be 6–30 digits, no letters or spaces'
      : null;

  const filled =
    accountHolder.trim().length >= 2 &&
    bankName.trim().length >= 2 &&
    ACCOUNT_NUMBER_RE.test(accountNumber);
  const canSubmit = filled && !update.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      await update.mutateAsync({
        accountHolder: accountHolder.trim(),
        bankName: bankName.trim(),
        accountNumber,
        // Gửi `''` là BE XOÁ về null — đúng ý khi người dùng chủ động xoá trắng ô chi nhánh.
        bankBranch: bankBranch.trim(),
      });
      toast.success('Bank account updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the bank account'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={account ? 'Change bank account' : 'Add bank account'}
      description="Where the platform sends your payouts"
      icon={Landmark}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {update.isPending ? 'Saving…' : 'Save account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {hasPendingPayout && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              You have a payout waiting for review. If you change the account
              now, that payout will be paid into the <strong>new</strong> account.
            </span>
          </p>
        )}

        <Field
          id="account-holder"
          label="Account holder"
          value={accountHolder}
          onChange={setAccountHolder}
          error={holderError}
          placeholder="Exactly as printed on the bank account"
        />
        <Field
          id="bank-name"
          label="Bank"
          value={bankName}
          onChange={setBankName}
          error={bankError}
          placeholder="e.g. Vietcombank"
        />
        <Field
          id="account-number"
          label="Account number"
          // Chưa đụng tới thì hiện số cũ đã che; vừa focus là trống ngay để gõ số mới.
          value={
            numberDraft ??
            (numberFocused ? '' : maskAccount(savedNumber ?? ''))
          }
          onChange={v => setNumberDraft(v.replace(/\D/g, ''))}
          onFocus={() => setNumberFocused(true)}
          onBlur={() => {
            setNumberFocused(false);
            // Bấm vào rồi bỏ đi mà chưa gõ gì ⇒ trả về số cũ, không để ô trống.
            if (savedNumber && numberDraft === '') setNumberDraft(null);
          }}
          error={numberError}
          placeholder={savedNumber ? 'Type the new number' : '6–30 digits'}
          hint={
            savedNumber && untouchedNumber
              ? 'This is the account currently on file. Leave it as it is to keep it.'
              : undefined
          }
          mono
          inputMode="numeric"
        />
        <Field
          id="bank-branch"
          label="Branch"
          optional
          value={bankBranch}
          onChange={setBankBranch}
          error={null}
          placeholder="Optional"
        />
      </div>
    </Modal>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  placeholder,
  hint,
  optional = false,
  mono = false,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error: string | null;
  placeholder?: string;
  /** Dòng phụ dưới ô — bị lỗi che khi có lỗi (một ô chỉ nói một điều). */
  hint?: string;
  optional?: boolean;
  mono?: boolean;
  inputMode?: 'numeric';
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm outline-none',
          mono && 'font-mono tracking-wide',
          error
            ? 'border-red-300 focus:border-red-500'
            : 'border-slate-200 focus:border-role-partner-primary'
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
