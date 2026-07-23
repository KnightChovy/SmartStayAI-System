import { AlertTriangle, Loader2, Plus, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelPolicies, useSetHotelPolicies } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import { EditableRow, RowSummary } from './EditableRow';
import { CheckboxField, TextField } from './fields';
import { useRowEditor, type RowWithId } from './use-row-editor';

/** Giới hạn của BE (Joi `setHotelPolicies`) — vượt là 400. */
const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;

interface PolicyRow extends RowWithId {
  title: string;
  description: string;
  important: boolean;
}

const emptyRow = (id: string): PolicyRow => ({
  id,
  title: '',
  description: '',
  important: false,
});

/** Trích mô tả cho dòng thu gọn — cắt ngắn để không đẩy dòng tóm tắt xuống nhiều hàng. */
function summaryBits(row: PolicyRow): string[] {
  const description = row.description.trim();
  if (!description) return [];
  return [description.length > 60 ? `${description.slice(0, 60)}…` : description];
}

interface Props {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

/**
 * Editor replace-all cho **điều khoản văn bản** của khách sạn (`GET/PUT /hotels/:id/policies`).
 *
 * Từ migration `split_policy_and_charge`, bảng này chỉ còn `title` / `description` /
 * `important` — không mang số tiền nào. Thuế/phí nằm ở `HotelChargesModal`
 * (`PUT /hotels/:id/charges`); đổi số bên đó mới đổi tiền khách trả.
 */
export function HotelPoliciesModal({ open, onClose, hotelId, hotelName }: Props) {
  const { data, isLoading, isError } = useHotelPolicies(hotelId);
  const setPolicies = useSetHotelPolicies(hotelId);

  const seed: PolicyRow[] = (data ?? []).map(p => ({
    id: p.id,
    title: p.title,
    description: p.description ?? '',
    important: p.important,
  }));

  const { rows, add, update, remove, isNew, isEditing, startEdit, stopEdit } = useRowEditor(
    seed,
    emptyRow
  );

  const handleSave = async () => {
    // Bỏ qua dòng chưa nhập tiêu đề (BE bắt buộc `title`) — dòng như vậy được đánh dấu rõ
    // trong phần tóm tắt để partner biết nó sẽ không được lưu.
    const valid = rows.filter(r => r.title.trim() !== '');
    try {
      await setPolicies.mutateAsync({
        policies: valid.map(r => ({
          title: r.title.trim().slice(0, TITLE_MAX),
          description: r.description.trim() || null,
          important: r.important,
        })),
      });
      toast.success('Policies updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update policies'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hotel policies"
      description={`${hotelName} · ${rows.length} item(s)`}
      icon={ScrollText}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setPolicies.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setPolicies.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setPolicies.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save policies
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState label="Failed to load policies." />
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Written terms guests read before booking. Taxes and service fees are configured
            separately under <span className="font-semibold">Taxes &amp; fees</span>.
          </p>
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No policies yet. Add one below.
            </p>
          )}
          {rows.map(row => (
            <EditableRow
              key={row.id}
              editing={isEditing(row.id)}
              entity="policy"
              editingLabel={isNew(row.id) ? 'New policy' : 'Editing policy'}
              onEdit={() => startEdit(row.id)}
              onDone={() => stopEdit(row.id)}
              onRemove={() => remove(row.id)}
              summary={
                <RowSummary
                  badge={
                    row.important ? (
                      <Pill tone="amber">
                        <AlertTriangle className="h-3 w-3" /> Important
                      </Pill>
                    ) : (
                      <Pill tone="slate">Policy</Pill>
                    )
                  }
                  meta={summaryBits(row)}
                  primary={row.title}
                  emptyPrimary="Untitled — won’t be saved"
                />
              }
            >
              <TextField
                label="Title"
                value={row.title}
                onChange={v => update(row.id, { title: v.slice(0, TITLE_MAX) })}
                placeholder="e.g. Cancellation policy"
                className="sm:col-span-2"
              />
              <TextField
                label="Description"
                value={row.description}
                onChange={v => update(row.id, { description: v.slice(0, DESCRIPTION_MAX) })}
                placeholder="What the guest needs to know"
                className="sm:col-span-2"
              />
              <CheckboxField
                label="Mark as important"
                hint="Shown first and highlighted on the guest page."
                checked={row.important}
                onChange={v => update(row.id, { important: v })}
                className="sm:col-span-2"
              />
            </EditableRow>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add policy
          </Button>
        </div>
      )}
    </Modal>
  );
}
