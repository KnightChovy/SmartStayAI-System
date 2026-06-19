import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/hotel-partner/shared/states';
import { ConfirmDialog } from '@/components/hotel-partner/shared/ConfirmDialog';
import {
  usePricingRules,
  useRoomTypes,
  useDeletePricingRule,
} from '@/hooks/hotel-management';
import type { PricingRule } from '@/types/hotel-management.types';
import { PricingRuleCard } from './PricingRuleCard';
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

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pricing Rules</h2>
          <p className="text-sm text-slate-500">
            Adjust prices by season, weekend, occupancy or early bird. Higher priority applies first.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add rule
        </Button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading pricing rules..." />
      ) : isError ? (
        <ErrorState label="Failed to load pricing rules." />
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No pricing rules yet"
          description="Create your first rule to automatically adjust room prices by condition."
          action={
            <Button
              onClick={openCreate}
              className="bg-role-partner-primary hover:bg-role-partner-secondary text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add rule
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {rules.map(rule => (
            <PricingRuleCard
              key={rule.id}
              rule={rule}
              onEdit={r => {
                setEditing(r);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
              deleting={deleteRule.isPending && deleteTarget?.id === rule.id}
            />
          ))}
        </div>
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
