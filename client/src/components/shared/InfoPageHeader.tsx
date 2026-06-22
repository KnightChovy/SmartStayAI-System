interface InfoPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function InfoPageHeader({
  eyebrow,
  title,
  description,
}: InfoPageHeaderProps) {
  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-8 text-center mb-14">
      <span className="bg-premium-gold/10 text-premium-gold text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
        {eyebrow}
      </span>
      <h1 className="font-be-vietnam text-3xl md:text-5xl font-bold text-on-surface mt-6 mb-4">
        {title}
      </h1>
      <p className="font-be-vietnam text-base text-on-surface-variant max-w-xl mx-auto">
        {description}
      </p>
    </div>
  );
}
