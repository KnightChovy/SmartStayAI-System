import { useState } from 'react';
import { Loader2, Contact, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import { ErrorState } from '@/components/hotel-partner/shared/states';
import { ListSkeleton } from '@/components/shared/skeletons';
import { useHotelContacts, useSetHotelContacts } from '@/hooks/hotel-property';
import { errorMessage } from '@/utils/errorMessage';
import type { ContactType, PhoneType } from '@/types/hotel-property.types';
import { SelectField, TextField } from './fields';
import { CONTACT_TYPE_OPTIONS, PHONE_TYPE_OPTIONS } from './labels';

interface ContactRow {
  contactType: ContactType;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  phoneType: PhoneType | '';
}

const emptyRow: ContactRow = {
  contactType: 'general',
  name: '',
  jobTitle: '',
  email: '',
  phone: '',
  phoneType: '',
};

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
  const [rows, setRows] = useState<ContactRow[] | null>(null);

  const current: ContactRow[] =
    rows ??
    (data ?? []).map(c => ({
      contactType: c.contactType,
      name: c.name ?? '',
      jobTitle: c.jobTitle ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      phoneType: c.phoneType ?? '',
    }));

  const update = (i: number, patch: Partial<ContactRow>) =>
    setRows(current.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const add = () => setRows([...current, { ...emptyRow }]);
  const remove = (i: number) => setRows(current.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    try {
      await setContacts.mutateAsync({
        contacts: current.map(r => ({
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
      description={`${hotelName} · ${current.length} contact(s)`}
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
          {current.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No contacts yet. Add one below.
            </p>
          )}
          {current.map((row, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Contact {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove contact"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Type"
                  value={row.contactType}
                  onChange={v => update(i, { contactType: (v || 'general') as ContactType })}
                  options={CONTACT_TYPE_OPTIONS}
                />
                <TextField
                  label="Name"
                  value={row.name}
                  onChange={v => update(i, { name: v })}
                  placeholder="Contact name"
                />
                <TextField
                  label="Job title"
                  value={row.jobTitle}
                  onChange={v => update(i, { jobTitle: v })}
                  placeholder="e.g. Front desk manager"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={row.email}
                  onChange={v => update(i, { email: v })}
                  placeholder="name@hotel.com"
                />
                <TextField
                  label="Phone"
                  value={row.phone}
                  onChange={v => update(i, { phone: v })}
                  placeholder="+84..."
                />
                <SelectField
                  label="Phone type"
                  value={row.phoneType}
                  onChange={v => update(i, { phoneType: v as PhoneType | '' })}
                  options={PHONE_TYPE_OPTIONS}
                  emptyLabel="—"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={add} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add contact
          </Button>
        </div>
      )}
    </Modal>
  );
}
