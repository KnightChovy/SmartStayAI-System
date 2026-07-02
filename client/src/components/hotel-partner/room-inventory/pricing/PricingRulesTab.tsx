import { useState } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { TableSkeleton } from '@/components/shared/skeletons';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import { DataTable, type Column } from '@/components/hotel-partner/shared/DataTable';
import { ActionMenu } from '@/components/hotel-partner/shared/ActionMenu';
import { Pill } from '@/components/hotel-partner/shared/Pill';
import { RULE_TYPE_LABELS, formatAdjustment } from '@/components/hotel-partner/shared/labels';
import { usePricingRules, useRoomTypes, useDeletePricingRule } from '@/hooks/hotel-management';
import { formatDate } from '@/utils/formatDate';
import type { PricingRule } from '@/types/hotel-management.types';
import { PricingRuleFormModal } from './PricingRuleFormModal';

interface PricingRulesTabProps {
  hotelId: string;
}

export function PricingRulesTab({ hotelId }: PricingRulesTabProps) {
  const { data: rules, isLoading, isError } = usePricingRules(hotelId);
  const { data: roomTypes } = useRoomTypes(hotelId);
  const deleteRule = useDeletePricingRule(hotelId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule.mutateAsync(deleteTarget.id);
      toast.success('Pricing rule deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const columns: Column<PricingRule>[] = [
    {
      id: 'name',
      header: 'Rule',
      cell: rule => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{rule.name}</p>
          <Pill tone="blue" className="mt-1">{RULE_TYPE_LABELS[rule.ruleType]}</Pill>
        </div>
      ),
    },
    {
      id: 'scope',
      header: 'Applies to',
      className: 'hidden md:table-cell',
      cell: rule => (
        <span className="text-slate-600">{rule.roomType?.name ?? 'All room types'}</span>
      ),
    },
    {
      id: 'dates',
      header: 'Date range',
      className: 'hidden lg:table-cell',
      cell: rule => (
        <span className="text-slate-600">
          {formatDate(rule.startDate)} – {formatDate(rule.endDate)}
        </span>
      ),
    },
    {
      id: 'adjustment',
      header: 'Adjustment',
      cell: rule => {
        const { text, isDiscount } = formatAdjustment(rule.adjustmentType, rule.adjustmentValue);
        return (
          <span className={cn('font-semibold', isDiscount ? 'text-red-600' : 'text-emerald-600')}>
            {text}
          </span>
        );
      },
    },
    {
      id: 'priority',
      header: 'Priority',
      align: 'center',
      className: 'hidden sm:table-cell',
      cell: rule => <span className="text-slate-600">{rule.priority}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: rule => (
        <Pill tone={rule.isActive ? 'emerald' : 'slate'}>{rule.isActive ? 'Active' : 'Inactive'}</Pill>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: rule => (
        <ActionMenu
          items={[
            { label: 'Edit', icon: Pencil, onClick: () => { setEditing(rule); setFormOpen(true); } },
            { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setDeleteTarget(rule) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pricing Rules</h2>
          <p className="text-sm text-slate-500">
            Adjust prices by season, weekend, occupancy or early bird. Higher priority applies first.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-role-partner-primary text-white hover:bg-role-partner-secondary">
          <Plus className="mr-1.5 h-4 w-4" /> Add rule
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : isError ? (
        <ErrorState label="Failed to load pricing rules." />
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No pricing rules yet"
          description="Create your first rule to automatically adjust room prices by condition."
          action={
            <Button onClick={openCreate} className="bg-role-partner-primary text-white hover:bg-role-partner-secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Add rule
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={rules} rowKey={rule => rule.id} minWidthClass="min-w-[680px]" />
      )}

      <PricingRuleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        hotelId={hotelId}
        roomTypes={roomTypes ?? []}
        rule={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete pricing rule"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteRule.isPending}
      />
    </div>
  );
}
