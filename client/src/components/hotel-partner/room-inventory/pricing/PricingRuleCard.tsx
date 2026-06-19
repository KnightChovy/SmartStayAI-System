import { Pencil, Trash2, Calendar, TrendingUp, TrendingDown, Hotel, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { RULE_TYPE_LABELS, DAY_OF_WEEK_LABELS } from '@/components/hotel-partner/shared/labels';
import type { PricingRule } from '@/types/hotel-management.types';

interface PricingRuleCardProps {
  rule: PricingRule;
  onEdit: (rule: PricingRule) => void;
  onDelete: (rule: PricingRule) => void;
  deleting?: boolean;
}

function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB');
}

export function PricingRuleCard({ rule, onEdit, onDelete, deleting }: PricingRuleCardProps) {
  const numericValue = Number(rule.adjustmentValue);
  const isDiscount = numericValue < 0;
  const adjustmentLabel =
    rule.adjustmentType === 'percentage'
      ? `${numericValue > 0 ? '+' : ''}${numericValue}%`
      : `${numericValue > 0 ? '+' : ''}${formatCurrency(Math.abs(numericValue))}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 truncate">{rule.name}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-role-partner-light text-role-partner-primary">
              {RULE_TYPE_LABELS[rule.ruleType]}
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              )}
            >
              {rule.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              {rule.roomType ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> {rule.roomType.name}
                </>
              ) : (
                <>
                  <Hotel className="w-3.5 h-3.5 text-slate-400" /> Whole hotel
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {fmtDate(rule.startDate)} – {fmtDate(rule.endDate)}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              Priority: <strong className="text-slate-700">{rule.priority}</strong>
            </span>
            {rule.ruleType === 'occupancy' && rule.occupancyThreshold != null && (
              <span className="text-slate-500">
                Threshold: <strong className="text-slate-700">{rule.occupancyThreshold}%</strong>
              </span>
            )}
          </div>

          {rule.dayOfWeek.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {rule.dayOfWeek.map(d => (
                <span
                  key={d}
                  className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5"
                >
                  {DAY_OF_WEEK_LABELS[d]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Adjustment badge */}
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg shrink-0',
            isDiscount ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          )}
        >
          {isDiscount ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {adjustmentLabel}
        </div>
      </div>

      <div className="flex gap-2 mt-3.5 pt-3 border-t border-slate-100">
        <Button size="sm" variant="outline" onClick={() => onEdit(rule)}>
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(rule)}
          disabled={deleting}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {deleting ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5 mr-1" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}
