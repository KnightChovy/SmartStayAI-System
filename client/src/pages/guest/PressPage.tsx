import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

const releases = [
  {
    date: 'May 2026',
    source: 'TechCrunch',
    title: 'SmartStay AI raises $20M to bring AI concierge to boutique hotels',
  },
  {
    date: 'Mar 2026',
    source: 'Skift',
    title: 'How SmartStay’s "quiet luxury" curation is reshaping travel discovery',
  },
  {
    date: 'Jan 2026',
    source: 'VnExpress',
    title: 'Vietnamese hospitality startup expands to 15 cities across Asia',
  },
  {
    date: 'Nov 2025',
    source: 'The Verge',
    title: 'A look inside the AI that plans your next luxury getaway',
  },
];

export default function PressPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="In the news"
        title="Press & Media"
        description="The latest coverage, announcements, and resources for journalists."
      />

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mb-12">
        <div className="rounded-3xl bg-primary text-on-primary p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-be-vietnam text-xl font-bold mb-1">
              Media kit
            </h2>
            <p className="text-on-primary/80 text-sm font-be-vietnam">
              Logos, brand guidelines, and executive bios in one download.
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-full shrink-0 bg-white text-primary hover:bg-white/90"
          >
            Download kit
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          Recent coverage
        </h2>
        <div className="space-y-4">
          {releases.map(r => (
            <div
              key={r.title}
              className="p-6 rounded-2xl bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest font-be-vietnam">
                  {r.source}
                </span>
                <span className="text-xs text-on-surface-variant font-be-vietnam">
                  {r.date}
                </span>
              </div>
              <h3 className="font-bold text-on-surface font-be-vietnam">
                {r.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 mt-12 text-center">
        <p className="text-on-surface-variant font-be-vietnam">
          Press inquiries:{' '}
          <a
            href="mailto:press@smartstay.ai"
            className="text-primary font-semibold hover:underline"
          >
            press@smartstay.ai
          </a>
        </p>
      </div>
    </div>
  );
}
