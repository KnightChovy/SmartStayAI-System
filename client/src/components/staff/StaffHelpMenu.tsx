import { Link } from 'react-router';
import { HelpCircle, QrCode, LogIn, Sparkles, BedDouble, LifeBuoy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/constants/routes';

const GUIDE = [
  {
    icon: QrCode,
    title: 'Scan check-in',
    detail: "Front desk → Scan check-in. Scan the guest's e-voucher QR, or type its code.",
    to: ROUTES.staffFrontDesk,
  },
  {
    icon: LogIn,
    title: 'Check in / check out',
    detail: 'Open a booking to assign a room, collect cash or record extra charges.',
    to: ROUTES.staffFrontDesk,
  },
  {
    icon: Sparkles,
    title: 'Housekeeping',
    detail: 'Tasks appear automatically at check-out. Marking one clean frees the room.',
    to: ROUTES.staffHousekeeping,
  },
  {
    icon: BedDouble,
    title: 'Room map',
    detail: 'Live status per room. Change a status when a room goes out of service.',
    to: ROUTES.staffRooms,
  },
];

/** Short "how do I…" guide for the front desk, plus where to get help. */
export function StaffHelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-8 items-center justify-center rounded-full border border-outline-variant/40 outline-none hover:bg-surface-container-low data-[state=open]:bg-surface-container-low"
        aria-label="Help"
      >
        <HelpCircle className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-900">Help</p>
          <p className="text-xs text-slate-400">Common front desk tasks</p>
        </div>

        <div className="py-1">
          {GUIDE.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.to}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-slate-900">{item.title}</span>
                  <span className="block text-[11px] text-slate-400">{item.detail}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-start gap-2.5 border-t border-slate-100 px-3 py-2.5">
          <LifeBuoy className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <p className="text-[11px] text-slate-500">
            Something looks wrong? Contact your hotel manager, or email{' '}
            <a
              href="mailto:support@stayhub.ai"
              className="font-medium text-slate-700 underline"
            >
              support@stayhub.ai
            </a>
            .
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
