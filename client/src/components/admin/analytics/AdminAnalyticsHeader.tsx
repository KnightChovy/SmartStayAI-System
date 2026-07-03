import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader';
import type { AdminAnalyticsHeaderProps } from '@/types/admin.types';

export function AdminAnalyticsHeader({
  title,
  description,
  onExport,
  isExporting,
}: AdminAnalyticsHeaderProps) {
  return (
    <AdminPageHeader
      title={title}
      description={description}
      actions={
        <Button
          className="h-12 rounded-full bg-black px-6 text-white"
          disabled={!onExport || isExporting}
          onClick={onExport}
          type="button"
        >
          {isExporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Export Report
        </Button>
      }
    />
  );
}
