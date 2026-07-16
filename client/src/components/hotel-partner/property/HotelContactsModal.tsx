import { Loader2, Contact, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelContacts, useSetHotelContacts } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type { ContactType, PhoneType } from '@/types/hotel-property.types';
import { EditableRow, RowSummary } from './EditableRow';
import { SelectField, TextField } from './fields';
import { useRowEditor, type RowWithId } from './use-row-editor';
import {
  CONTACT_TYPE_OPTIONS,
  CONTACT_TYPE_TONE,
  PHONE_TYPE_OPTIONS,
  optionLabel,
} from './labels';

interface ContactRow extends RowWithId {
  contactType: ContactType;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  phoneType: PhoneType | '';
}

const emptyRow = (id: string): ContactRow => ({
  id,
  contactType: 'general',
  name: '',
  jobTitle: '',
  email: '',
  phone: '',
  phoneType: '',
});

/** Thông tin phụ của một contact, chỉ gồm field đã nhập. */
function summaryBits(row: ContactRow): string[] {
  const bits: string[] = [];
  if (row.jobTitle.trim()) bits.push(row.jobTitle.trim());
  if (row.email.trim()) bits.push(row.email.trim());
  const phone = row.phone.trim();
  if (phone) {
    bits.push(
      row.phoneType ? `${phone} (${optionLabel(PHONE_TYPE_OPTIONS, row.phoneType)})` : phone
    );
  }
  return bits;
}

interface Props {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

/** Editor replace-all cho contacts của khách sạn (`GET/PUT /hotels/:id/contacts`). */
export function HotelContactsModal({ open, onClose, hotelId, hotelName }: Props) {
  const { data, isLoading, isError } = useHotelContacts(hotelId);
  const setContacts = useSetHotelContacts(hotelId);

  const seed: ContactRow[] = (data ?? []).map(c => ({
    id: c.id,
    contactType: c.contactType,
    name: c.name ?? '',
    jobTitle: c.jobTitle ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    phoneType: c.phoneType ?? '',
  }));

  const { rows, add, update, remove, isNew, isEditing, startEdit, stopEdit } = useRowEditor(
    seed,
    emptyRow
  );

  const handleSave = async () => {
    try {
      await setContacts.mutateAsync({
        contacts: rows.map(r => ({
          contactType: r.contactType,
          name: r.name.trim() || null,
          jobTitle: r.jobTitle.trim() || null,
          email: r.email.trim() || null,
          phone: r.phone.trim() || null,
          phoneType: r.phoneType || null,
        })),
      });
      toast.success('Contacts updated');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update contacts'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hotel contacts"
      description={`${hotelName} · ${rows.length} contact(s)`}
      icon={Contact}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setContacts.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={setContacts.isPending || isLoading}
            className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
          >
            {setContacts.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save contacts
          </Button>
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <ErrorState label="Failed to load contacts." />
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No contacts yet. Add one below.
            </p>
          )}
          {rows.map(row => (
            <EditableRow
              key={row.id}
              editing={isEditing(row.id)}
              entity="contact"
              editingLabel={isNew(row.id) ? 'New contact' : 'Editing contact'}
              onEdit={() => startEdit(row.id)}
              onDone={() => stopEdit(row.id)}
              onRemove={() => remove(row.id)}
              summary={
                <RowSummary
                  badge={
                    <Pill tone={CONTACT_TYPE_TONE[row.contactType]}>
                      {optionLabel(CONTACT_TYPE_OPTIONS, row.contactType)}
                    </Pill>
                  }
                  meta={summaryBits(row)}
                  primary={row.name}
                  emptyPrimary="No name"
                />
              }
            >
              <SelectField
                label="Type"
                value={row.contactType}
                onChange={v => update(row.id, { contactType: (v || 'general') as ContactType })}
                options={CONTACT_TYPE_OPTIONS}
              />
              <TextField
                label="Name"
                value={row.name}
                onChange={v => update(row.id, { name: v })}
                placeholder="Contact name"
              />
              <TextField
                label="Job title"
                value={row.jobTitle}
                onChange={v => update(row.id, { jobTitle: v })}
                placeholder="e.g. Front desk manager"
              />
              <TextField
                label="Email"
                type="email"
                value={row.email}
                onChange={v => update(row.id, { email: v })}
                placeholder="name@hotel.com"
              />
              <TextField
                label="Phone"
                value={row.phone}
                onChange={v => update(row.id, { phone: v })}
                placeholder="+84..."
              />
              <SelectField
                label="Phone type"
                value={row.phoneType}
                onChange={v => update(row.id, { phoneType: v as PhoneType | '' })}
                options={PHONE_TYPE_OPTIONS}
                emptyLabel="—"
              />
            </EditableRow>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add contact
          </Button>
        </div>
      )}
    </Modal>
  );
}
