import InfoPageHeader from '../../components/shared/InfoPageHeader';

const tiers = [
  {
    name: 'Flexible',
    highlight: true,
    refund: 'Full refund',
    window: 'Cancel up to 24h before check-in',
    desc: 'Plans change — get 100% back when you cancel at least one day ahead.',
  },
  {
    name: 'Standard',
    highlight: false,
    refund: '50% refund',
    window: 'Cancel up to 5 days before check-in',
    desc: 'A balanced rate. Half your booking value is refunded inside the window.',
  },
  {
    name: 'Non-refundable',
    highlight: false,
    refund: 'No refund',
    window: 'Best price, no changes',
    desc: 'The lowest price in exchange for a committed, locked-in reservation.',
  },
];

const steps = [
  'Go to My Bookings from your account menu.',
  'Select the reservation you want to change.',
  'Click Cancel and confirm — you’ll see the refund amount instantly.',
  'Refunds return to your original payment method within 5–10 business days.',
];

export default function CancellationOptionsPage() {
  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="Flexibility that fits"
        title="Cancellation Options"
        description="Understand each rate type so you can book with total confidence."
      />

      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`p-8 rounded-3xl transition-shadow ${
                tier.highlight
                  ? 'bg-primary text-on-primary shadow-lg'
                  : 'bg-white ring-1 ring-outline-variant/10 shadow-sm hover:shadow-md'
              }`}
            >
              <h3 className="font-be-vietnam text-lg font-bold mb-1">
                {tier.name}
              </h3>
              <p
                className={`text-2xl font-bold font-be-vietnam mb-2 ${
                  tier.highlight ? 'text-on-primary' : 'text-primary'
                }`}
              >
                {tier.refund}
              </p>
              <p
                className={`text-sm font-medium mb-4 ${
                  tier.highlight
                    ? 'text-on-primary/80'
                    : 'text-on-surface-variant'
                }`}
              >
                {tier.window}
              </p>
              <p
                className={`text-sm font-be-vietnam ${
                  tier.highlight
                    ? 'text-on-primary/90'
                    : 'text-on-surface-variant'
                }`}
              >
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-margin-mobile md:px-8">
        <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-6">
          How to cancel
        </h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 font-be-vietnam">
                {i + 1}
              </span>
              <span className="text-on-surface-variant font-be-vietnam pt-1">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
