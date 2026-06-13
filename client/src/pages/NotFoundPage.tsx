import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Trang 404 cho đường dẫn không tồn tại. */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-margin-mobile py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-8" />
      </div>
      <p className="mt-6 font-be-vietnam text-6xl font-bold text-on-surface">404</p>
      <h1 className="mt-2 font-be-vietnam text-xl font-semibold text-on-surface">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-on-surface-variant">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild className="bg-on-surface text-white hover:bg-primary">
          <Link to="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/search">Explore stays</Link>
        </Button>
      </div>
    </div>
  );
}
