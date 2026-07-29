import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Globe2,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

export default function PartnerLandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const getStarted = () => {
    if (isAuthenticated && user?.role === UserRole.HOTEL_PARTNER) {
      navigate('/partner/verify');
    } else {
      navigate(ROUTES.partnerSignup);
    }
  };

  return (
    <div className="bg-surface text-on-surface">
      <section className="relative overflow-hidden bg-role-partner-light">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-role-partner-primary/10 blur-3xl pointer-events-none"
        />
        <div className="relative max-w-7xl mx-auto px-margin-mobile md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-role-partner-primary/20 px-3 py-1 text-xs font-semibold text-role-partner-primary mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              StayHub for Partners
            </span>
            <h1 className="font-be-vietnam text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-on-surface mb-5">
              List your property on{' '}
              <span className="text-role-partner-primary">StayHub</span>
            </h1>
            <p className="text-lg text-on-surface-variant max-w-lg mb-8">
              Reach millions of travelers, manage bookings with AI-powered
              tools, and get paid on time. Registration is free — start
              welcoming guests in just a few steps.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Button
                onClick={getStarted}
                className="h-13 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white text-base font-semibold rounded-xl shadow-lg shadow-role-partner-primary/20 cursor-pointer group"
              >
                Get started now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-sm text-on-surface-variant">
                Already a partner?{' '}
                <Link
                  to={ROUTES.login}
                  className="font-semibold text-role-partner-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-role-partner-primary" />
              No listing fees · Cancel anytime · Verified in 24–48h
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"
              alt="A modern hotel property ready to welcome guests"
              className="w-full h-80 md:h-[26rem] object-cover rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white rounded-2xl shadow-xl border border-outline-variant/20 p-4 flex items-center gap-3">
              <div className="size-11 rounded-xl bg-role-partner-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-role-partner-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-on-surface leading-none">
                  +38%
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  avg. bookings in 90 days
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-outline-variant/20 bg-white">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-role-partner-primary">
                {s.value}
              </p>
              <p className="text-sm text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
            Everything you need to grow
          </h2>
          <p className="text-on-surface-variant text-lg">
            Powerful tools built for hoteliers — from your first listing to a
            fully-booked calendar.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map(b => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-outline-variant/20 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="size-12 rounded-xl bg-role-partner-light flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-role-partner-primary" />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">
                {b.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-role-partner-light/60">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">
              List in 3 simple steps
            </h2>
            <p className="text-on-surface-variant text-lg">
              Most partners go live within 48 hours of submitting their details.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-7 h-full shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="size-10 rounded-full bg-role-partner-primary text-white flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <s.icon className="w-6 h-6 text-role-partner-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 w-6 h-6 text-role-partner-primary/40" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              onClick={getStarted}
              className="h-12 px-8 bg-role-partner-primary hover:bg-role-partner-secondary text-white font-semibold rounded-xl shadow-lg shadow-role-partner-primary/20 cursor-pointer"
            >
              Start your listing <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-margin-mobile md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-14 items-center">
        <img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1600&auto=format&fit=crop"
          alt="Hotel dashboard and analytics"
          className="w-full h-80 md:h-[26rem] object-cover rounded-3xl shadow-xl order-last lg:order-first"
        />
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-6">
            Made for modern hoteliers
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-role-partner-primary shrink-0 mt-0.5" />
                <span className="text-on-surface-variant">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white border-y border-outline-variant/20">
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-8 py-16 md:py-20 text-center">
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl font-medium text-on-surface leading-relaxed mb-6">
            “Onboarding took an afternoon and we were fully booked for the
            weekend within a week. The AI booking assistant handles guest
            questions so my front desk can focus on the stay.”
          </blockquote>
          <div className="text-sm">
            <p className="font-semibold text-on-surface">Linh Nguyen</p>
            <p className="text-on-surface-variant">
              Owner, The Grand Continental Saigon
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-margin-mobile md:px-8 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-on-surface text-center mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-linear-to-tr from-role-partner-primary to-role-partner-secondary">
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-8 py-16 md:py-20 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to welcome your first guests?
          </h2>
          <p className="text-white/85 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of properties growing with StayHub. It's free to list
            and takes just minutes to start.
          </p>
          <Button
            onClick={getStarted}
            className="h-13 px-9 bg-white text-role-partner-primary hover:bg-white/90 text-base font-bold rounded-xl shadow-xl cursor-pointer group"
          >
            List your property
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </div>
  );
}

// ── FAQ accordion item ────────────────────────────────────────────────────
function FaqItem({
  q,
  a,
  defaultOpen = false,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-on-surface">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-on-surface-variant shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1 text-sm text-on-surface-variant leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

const STATS = [
  { value: '2M+', label: 'Active travelers' },
  { value: '10K+', label: 'Partner properties' },
  { value: '48h', label: 'Avg. verification' },
  { value: '0₫', label: 'Listing fee' },
];

const BENEFITS = [
  {
    icon: Globe2,
    title: 'Reach more guests',
    desc: 'Get discovered by millions of travelers searching for their next stay across web and mobile.',
  },
  {
    icon: Sparkles,
    title: 'AI booking assistant',
    desc: 'An always-on concierge answers guest questions and nudges bookings while you sleep.',
  },
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    desc: 'Track occupancy, revenue, and performance with dashboards built for decision-making.',
  },
  {
    icon: CreditCard,
    title: 'Reliable payouts',
    desc: 'Secure, on-time payments with transparent commission and a clear revenue wallet.',
  },
  {
    icon: CalendarCheck,
    title: 'Smart inventory',
    desc: 'Manage room types, pricing rules, and availability from one simple control center.',
  },
  {
    icon: Headphones,
    title: '24/7 partner support',
    desc: 'A dedicated team helps you set up, optimize, and resolve issues whenever you need it.',
  },
];

const STEPS = [
  {
    icon: Users,
    title: 'Create your account',
    desc: 'Sign up free in minutes with your email — no credit card, no listing fee.',
  },
  {
    icon: BadgeCheck,
    title: 'Add & verify your hotel',
    desc: 'Share your property details, licenses, and photos. Our team verifies within 48 hours.',
  },
  {
    icon: CalendarCheck,
    title: 'Go live & get booked',
    desc: 'Publish your rooms, set pricing, and start welcoming guests right away.',
  },
];

const FEATURES = [
  'Free registration with zero upfront cost',
  'Full control over rooms, rates, and availability',
  'Guest reviews and reputation management',
  'Automated invoices, payouts, and revenue tracking',
  'AI-drafted content to make your listing shine',
  'Fraud protection and verified guest bookings',
];

const FAQS = [
  {
    q: 'How much does it cost to list my property?',
    a: 'Listing is completely free. You only pay a commission on confirmed bookings — there are no upfront or monthly fees.',
  },
  {
    q: 'How long does verification take?',
    a: 'Once you submit your property details and documents, our team typically verifies your listing within 24–48 hours.',
  },
  {
    q: 'When and how do I get paid?',
    a: 'Payouts are transferred securely to your registered bank account on schedule after guest check-in. You can track everything in your revenue wallet.',
  },
  {
    q: 'Do I need a business license to join?',
    a: 'Yes. To keep the platform trustworthy, you’ll provide your business license and accommodation certificates during verification.',
  },
  {
    q: 'Can I manage multiple properties?',
    a: 'Absolutely. You can add and manage multiple hotels from a single partner account with per-property dashboards.',
  },
];
