import { useState } from 'react';
import InfoPageHeader from '../../components/shared/InfoPageHeader';
import { Button } from '../../components/ui/button';

const topics = [
  'Safety issue',
  'Payment problem',
  'Property misrepresentation',
  'Inappropriate behavior',
  'Technical bug',
  'Other',
];

export default function ReportConcernPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-only demo — no backend call.
    setSubmitted(true);
  };

  return (
    <div className="py-12 w-full">
      <InfoPageHeader
        eyebrow="We take this seriously"
        title="Report a Concern"
        description="Tell us what happened. Our Trust & Safety team reviews every report."
      />

      <div className="max-w-2xl mx-auto px-margin-mobile md:px-8">
        {submitted ? (
          <div className="rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-primary text-3xl">
                task_alt
              </span>
            </div>
            <h2 className="font-be-vietnam text-2xl font-bold text-on-surface mb-2">
              Report received
            </h2>
            <p className="text-on-surface-variant font-be-vietnam mb-6">
              Thank you for letting us know. Our team will review your report and
              follow up by email if we need more details.
            </p>
            <Button
              onClick={() => setSubmitted(false)}
              className="rounded-full px-6"
            >
              Submit another report
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white ring-1 ring-outline-variant/10 shadow-sm p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                  Full name
                </label>
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                  Email
                </label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                Type of concern
              </label>
              <select
                required
                defaultValue=""
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
              >
                <option value="" disabled>
                  Select a topic
                </option>
                {topics.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                Booking code (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. BKMQI8WO17C4B983"
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2 font-be-vietnam">
                What happened?
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe the issue in as much detail as you can..."
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-be-vietnam resize-none"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-full">
              Submit report
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
