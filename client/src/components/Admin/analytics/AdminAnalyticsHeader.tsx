import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/Admin/shared/AdminPageHeader';

interface AdminAnalyticsHeaderProps {
  title: string;
  description: string;
}

export function AdminAnalyticsHeader({
  title,
  description,
}: AdminAnalyticsHeaderProps) {
  return (
    <AdminPageHeader
      title={title}
      description={description}
      actions={
        <Button className="h-12 rounded-full bg-black px-6 text-white">
          <Download className="mr-2 size-4" />
          Export Report
        </Button>
      }
    />
  );
}
