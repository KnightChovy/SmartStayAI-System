import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

const perks = [
  { icon: 'rocket_launch', label: 'Fast-growing startup' },
  { icon: 'public', label: 'Remote-friendly' },
  { icon: 'flight_takeoff', label: 'Travel credits' },
  { icon: 'school', label: 'Learning budget' },
];

const openings = [
  {
    title: 'Senior Frontend Engineer',
    team: 'Engineering',
    location: 'Ho Chi Minh City · Hybrid',
    type: 'Full-time',
  },
  {
    title: 'AI/ML Engineer',
    team: 'AI Platform',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Ha Noi · Hybrid',
    type: 'Full-time',
  },
  {
    title: 'Hotel Partnerships Manager',
    team: 'Growth',
    location: 'Da Nang · On-site',
    type: 'Full-time',
  },
  {
    title: 'Customer Success Specialist',
    team: 'Support',
    location: 'Remote',
    type: 'Contract',
  },
];

export default function CareersPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="Join the journey"
        title="Careers at SmartStay"
        description="Help us build the future of intelligent travel. We hire for curiosity, craft, and care."
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map(p => (
            <div
              key={p.label}
              className="flex items-center gap-3 p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-primary">
                {p.icon}
              </span>
              <span className="text-sm font-semibold text-on-surface font-be-vietnam">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          Open positions
        </h2>
        <div className="space-y-4">
          {openings.map(job => (
            <div
              key={job.title}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-bold text-on-surface font-be-vietnam">
                  {job.title}
                </h3>
                <p className="text-sm text-on-surface-variant font-be-vietnam mt-1">
                  {job.team} · {job.location} · {job.type}
                </p>
              </div>
              <Button variant="outline" className="rounded-full shrink-0">
                Apply
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
