import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant/30 pt-section-gap pb-12 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-stack-lg mb-stack-lg">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <span className="font-be-vietnam text-2xl font-bold tracking-tight text-on-surface block mb-4">
              Smart Stay AI
            </span>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Revolutionizing luxury travel through intelligent discovery and
              seamless experiences.
            </p>
          </div>
          {/* Cities Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              Cities
            </h5>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/destinations"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Paris
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  New York
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  London
                </Link>
              </li>
              <li>
                <Link
                  to="/destinations"
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  Tokyo
                </Link>
              </li>
            </ul>
          </div>
          {/* Support Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              Support
            </h5>
            <ul className="space-y-4">
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Safety Information
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Cancellation Options
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Report Concern
                </a>
              </li>
            </ul>
          </div>
          {/* Company Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              Company
            </h5>
            <ul className="space-y-4">
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Press
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                  href="#"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface-variant">
            © 2024 Smart Stay AI. All rights reserved.
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
