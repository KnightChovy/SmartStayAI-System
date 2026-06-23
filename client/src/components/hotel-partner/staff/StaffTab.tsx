import { useMemo, useState } from 'react';
import { Plus, Users, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import AppFilter from '@/common/filter/AppFilter';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { useHotelStaff, useRemoveHotelStaff } from '@/hooks/hotel-staff';
import { errorMessage } from '@/utils/errorMessage';
import { formatDateShort } from '@/utils/formatDate';
import type { StaffAssignment, StaffRole } from '@/types/hotel-staff.types';
import { STAFF_ROLE_CONFIG, STAFF_ROLE_OPTIONS, USER_STATUS_CONFIG } from './labels';
import { StaffFormModal } from './StaffFormModal';

interface StaffTabProps {
  hotelId: string;
  hotelName: string;
}

const ALL = 'all';

/** Quản lý nhân viên của MỘT khách sạn: danh sách + thêm + bỏ gán. */
export function StaffTab({ hotelId, hotelName }: StaffTabProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | typeof ALL>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [removing, setRemoving] = useState<StaffAssignment | null>(null);

  const { data: staff, isLoading, isError } = useHotelStaff(hotelId);
  const removeMutation = useRemoveHotelStaff(hotelId);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (staff ?? []).filter(a => {
      const matchesSearch =
        !q ||
        a.user.fullName.toLowerCase().includes(q) ||
        a.user.email.toLowerCase().includes(q) ||
        (a.user.phone ?? '').toLowerCase().includes(q);
      const matchesRole = roleFilter === ALL || a.assignedRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const hasFilter = search.trim() !== '' || roleFilter !== ALL;

  const roleOptions = [
    { label: 'All roles', value: ALL },
    ...STAFF_ROLE_OPTIONS.map(o => ({ label: o.label, value: o.value })),
  ];

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeMutation.mutateAsync(removing.user.id);
      toast.success('Staff member removed');
      setRemoving(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to remove staff member'));
    }
  };

  const columns: Column<StaffAssignment>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: a => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{a.user.fullName}</p>
          <p className="truncate text-xs text-slate-400">{a.user.email}</p>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      className: 'hidden md:table-cell',
      cell: a => <span className="text-slate-600">{a.user.phone || '—'}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      cell: a => {
        const cfg = STAFF_ROLE_CONFIG[a.assignedRole];
        return <Pill className={cfg.class}>{cfg.label}</Pill>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: a => {
        const cfg = USER_STATUS_CONFIG[a.user.status];
        return <Pill className={cfg.class}>{cfg.label}</Pill>;
      },
    },
    {
      id: 'assignedAt',
      header: 'Assigned',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: a => <span className="text-slate-600">{formatDateShort(a.assignedAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: a => (
        <ActionMenu
          items={[
            {
              label: 'Remove',
              icon: Trash2,
              destructive: true,
              onClick: () => setRemoving(a),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff</h2>
          <p className="text-sm text-slate-500">
            {staff
              ? `${staff.length} staff ${staff.length === 1 ? 'member' : 'members'}`
              : 'Create accounts and assign staff to this hotel.'}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-role-partner-primary text-white hover:bg-role-partner-secondary"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add staff
        </Button>
      </div>

      <div className="mb-4">
        <AppFilter
          search={search}
          onSearchChange={setSearch}
          status={roleFilter}
          onStatusChange={v => setRoleFilter(v as StaffRole | typeof ALL)}
          statusOptions={roleOptions}
          onReset={() => {
            setSearch('');
            setRoleFilter(ALL);
          }}
        />
      </div>

      {isLoading ? (
        <LoadingState label="Loading staff..." />
      ) : isError ? (
        <ErrorState label="Failed to load the staff list." />
      ) : (staff?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add front desk and housekeeping staff so they can operate this hotel."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No staff match your filters"
          description={hasFilter ? 'Try adjusting your search keyword or role filter.' : undefined}
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={a => a.id} />
      )}

      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        hotelId={hotelId}
        hotelName={hotelName}
      />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remove staff member"
        message={
          removing
            ? `Remove ${removing.user.fullName} from ${hotelName}? Their account stays active but they will no longer be assigned to this hotel.`
            : ''
        }
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        destructive
      />
    </div>
  );
}
