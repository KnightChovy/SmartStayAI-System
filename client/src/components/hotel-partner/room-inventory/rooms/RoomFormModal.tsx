import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, BedDouble } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/hotel-partner/shared/Modal';
import {
  TextField,
  SelectField,
  TextareaField,
  FieldShell,
} from '@/components/hotel-partner/shared/form-controls';
import { ROOM_STATUS_OPTIONS } from '@/components/hotel-partner/shared/labels';
import { roomFormSchema, type RoomFormValues } from '@/validations/hotel-management.validation';
import { useCreateRoom, useUpdateRoom } from '@/hooks/hotel-management';
import type {
  ManagedRoomType,
  PhysicalRoom,
  CreateRoomDto,
  UpdateRoomDto,
} from '@/types/hotel-management.types';

interface RoomFormModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  roomTypes: ManagedRoomType[];
  /** When set, the modal is in edit mode. */
  room?: PhysicalRoom | null;
}

export function RoomFormModal({ open, onClose, hotelId, roomTypes, room }: RoomFormModalProps) {
  const isEdit = !!room;
  const createMutation = useCreateRoom(hotelId);
  const updateMutation = useUpdateRoom(hotelId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    values: {
      roomTypeId: room?.roomTypeId ?? roomTypes[0]?.id ?? '',
      roomNumber: room?.roomNumber ?? '',
      floor: room?.floor != null ? String(room.floor) : '',
      status: room?.status ?? 'available',
      notes: room?.notes ?? '',
    },
  });

  const onSubmit = methods.handleSubmit(async values => {
    const notes = values.notes?.trim() ? values.notes.trim() : null;
    const floor = values.floor?.trim() ? Number(values.floor) : null;
    try {
      if (isEdit && room) {
        const dto: UpdateRoomDto = {
          roomNumber: values.roomNumber.trim(),
          floor,
          status: values.status,
          notes,
        };
        await updateMutation.mutateAsync({ roomId: room.id, dto });
        toast.success('Room updated');
      } else {
        const dto: CreateRoomDto = {
          roomTypeId: values.roomTypeId,
          roomNumber: values.roomNumber.trim(),
          floor,
          status: values.status,
          notes,
        };
        await createMutation.mutateAsync(dto);
        toast.success('Room created');
      }
      onClose();
    } catch (err) {
      // Surface the backend message (e.g. duplicate room number) when present.
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (isEdit ? 'Failed to update room' : 'Failed to create room');
      toast.error(message);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit room' : 'Add room'}
      description={isEdit ? `Room ${room?.roomNumber}` : 'Create a new physical room'}
      icon={BedDouble}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create room'}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {isEdit ? (
            <FieldShell label="Room type">
              <div className="h-9 flex items-center px-2.5 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                {room?.roomType.name ?? '—'}
              </div>
            </FieldShell>
          ) : (
            <SelectField<RoomFormValues>
              name="roomTypeId"
              label="Room type"
              required
              placeholder="Select a room type"
              options={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <TextField<RoomFormValues> name="roomNumber" label="Room number" required placeholder="201" />
            <TextField<RoomFormValues>
              name="floor"
              label="Floor"
              type="number"
              min={0}
              max={200}
              step="1"
              placeholder="2"
            />
          </div>

          <SelectField<RoomFormValues>
            name="status"
            label="Status"
            required
            options={ROOM_STATUS_OPTIONS}
          />

          <TextareaField<RoomFormValues> name="notes" label="Notes" placeholder="Internal notes..." rows={2} />
        </form>
      </FormProvider>
    </Modal>
  );
}
