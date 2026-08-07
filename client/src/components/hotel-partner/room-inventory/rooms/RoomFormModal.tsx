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
import {
  EDITABLE_ROOM_STATUS_OPTIONS,
  ROOM_STATUS_CONFIG,
} from '@/components/hotel-partner/shared/labels';
import {
  isEditableRoomStatus,
  roomFormSchema,
  type RoomFormValues,
} from '@/validations/hotel-management.validation';
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

  /**
   * Phòng đang `occupied`/`maintenance` thì trạng thái KHÔNG sửa được ở form này (BE trả 400).
   * Nạp thẳng giá trị đó vào form sẽ để lại một giá trị không hợp lệ trong payload, nên quy về
   * `available` cho form và bỏ hẳn `status` khỏi payload — xem `statusLocked` bên dưới.
   */
  const statusLocked = isEdit && !!room && !isEditableRoomStatus(room.status);

  const methods = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    values: {
      roomTypeId: room?.roomTypeId ?? roomTypes[0]?.id ?? '',
      roomNumber: room?.roomNumber ?? '',
      floor: room?.floor != null ? String(room.floor) : '',
      status: room && isEditableRoomStatus(room.status) ? room.status : 'available',
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
          // Trạng thái bị khoá ⇒ không gửi field này (BE chỉ cần ≥1 field), tránh ghi đè trạng thái
          // do check-in / đợt chặn sinh ra bằng một giá trị form.
          ...(statusLocked ? {} : { status: values.status }),
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

          {/*
            Chỉ Available/Cleaning. "Maintenance" từng nằm ở đây và bấm là BE âm thầm chặn phòng
            suốt 7 ngày kể từ hôm nay với lý do bịa sẵn — bảo trì giờ phải khai khoảng ngày ở
            Rooms & inventory. "Occupied" thì phải đi kèm một booking nên chỉ check-in tạo ra.
          */}
          {statusLocked && room ? (
            <FieldShell label="Status">
              <div className="h-9 flex items-center px-2.5 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                {ROOM_STATUS_CONFIG[room.status].label}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {room.status === 'occupied'
                  ? 'Set by check-in — change it from the front desk.'
                  : 'This room is blocked for maintenance — end the block from Rooms & inventory.'}
              </p>
            </FieldShell>
          ) : (
            <SelectField<RoomFormValues>
              name="status"
              label="Status"
              required
              options={EDITABLE_ROOM_STATUS_OPTIONS}
              hint="Maintenance is set by blocking the room for a date range; occupied comes from check-in."
            />
          )}

          <TextareaField<RoomFormValues> name="notes" label="Notes" placeholder="Internal notes..." rows={2} />
        </form>
      </FormProvider>
    </Modal>
  );
}
