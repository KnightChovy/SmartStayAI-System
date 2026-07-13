import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';

export default function Footer() {
  const { t } = useTranslation('footer');
  const supportLinks = [
    { label: t('links.helpCenter'), to: ROUTES.helpCenter },
    { label: t('links.safety'), to: ROUTES.safety },
    { label: t('links.cancellation'), to: ROUTES.cancellationOptions },
    { label: t('links.report'), to: ROUTES.reportConcern },
  ];
  const companyLinks = [
    { label: t('links.about'), to: ROUTES.about },
    { label: t('links.careers'), to: ROUTES.careers },
    { label: t('links.press'), to: ROUTES.press },
    { label: t('links.blog'), to: ROUTES.blog },
  ];
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
              {t('tagline')}
            </p>
          </div>
          {/* Support Column */}
          <div>
            <h5 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-6">
              {t('support')}
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
              {t('company')}
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
            © {new Date().getFullYear()} Smart Stay AI. {t('rights')}
          </p>
          <div className="flex gap-8">
            <a
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              {t('privacy')}
            </a>
            <a
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              {t('terms')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
