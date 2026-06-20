import { Link } from 'react-router';
import { ROUTES } from '@/constants/routes';

const supportLinks = [
  { label: 'Help Center', to: ROUTES.helpCenter },
  { label: 'Safety Information', to: ROUTES.safety },
  { label: 'Cancellation Options', to: ROUTES.cancellationOptions },
  { label: 'Report Concern', to: ROUTES.reportConcern },
];

const companyLinks = [
  { label: 'About Us', to: ROUTES.about },
  { label: 'Careers', to: ROUTES.careers },
  { label: 'Press', to: ROUTES.press },
  { label: 'Blog', to: ROUTES.blog },
];

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant/30 pt-section-gap pb-12 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg mb-stack-lg">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <span className="font-be-vietnam text-2xl font-bold tracking-tight text-on-surface block mb-4">
              Smart Stay AI
            </span>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-sm">
              Revolutionizing luxury travel through intelligent discovery and
              seamless experiences.
            </p>
          </div>
          {/* Support Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              Support
            </h5>
            <ul className="space-y-4">
              {supportLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Company Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              Company
            </h5>
            <ul className="space-y-4">
              {companyLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Smart Stay AI. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
