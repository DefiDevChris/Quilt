import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

type CardVariant = 'primary' | 'surface' | 'secondary' | 'accent';

const variantStyles: Record<
  CardVariant,
  {
    link: string;
    imageTint: string;
    label: string;
    divider: string;
    title: string;
    description: string;
    cta: string;
  }
> = {
  primary: {
    link: 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] hover:opacity-95',
    imageTint: 'text-white/20',
    label: 'text-white/50',
    divider: 'bg-[var(--color-text-on-primary)]/30',
    title: 'text-white',
    description: 'text-white/70',
    cta: 'text-white',
  },
  surface: {
    link: 'bg-[var(--color-surface)] border-[var(--color-text)]/[0.03] hover:bg-[var(--color-primary)]/5',
    imageTint: 'text-[var(--color-primary)]/20',
    label: 'text-[var(--color-primary)]',
    divider: 'bg-[var(--color-primary)]/30',
    title: 'text-[var(--color-text)]',
    description: 'text-[var(--color-text)]/50',
    cta: 'text-[var(--color-primary)]',
  },
  secondary: {
    link: 'bg-[var(--color-secondary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/10',
    imageTint: 'text-[var(--color-primary)]/20',
    label: 'text-[var(--color-primary)]',
    divider: 'bg-[var(--color-primary)]/30',
    title: 'text-[var(--color-text)]',
    description: 'text-[var(--color-text-dim)]',
    cta: 'text-[var(--color-primary)]',
  },
  accent: {
    link: 'bg-[var(--color-accent)] text-[var(--color-text)] border-black/[0.03] hover:opacity-95',
    imageTint: 'text-[var(--color-text)]/10',
    label: 'text-[var(--color-text)]/50',
    divider: 'bg-[var(--color-text)]/20',
    title: 'text-[var(--color-text)]',
    description: 'text-[var(--color-text)]/60',
    cta: 'text-[var(--color-text)]',
  },
};

interface DashboardCardProps {
  href: string;
  imageSrc: string;
  imageAlt: string;
  label: string;
  title: string;
  description: string;
  cta: string;
  variant: CardVariant;
  span?: string;
}

export function DashboardCard({
  href,
  imageSrc,
  imageAlt,
  label,
  title,
  description,
  cta,
  variant,
  span,
}: DashboardCardProps) {
  const v = variantStyles[variant];

  return (
    <Link
      href={href}
      className={`relative rounded-lg p-8 lg:p-10 flex flex-col justify-between overflow-hidden transition duration-200 shadow-elevated border ${v.link} ${span ?? ''}`}
    >
      <div className={`absolute bottom-4 right-4 w-24 h-24 pointer-events-none ${v.imageTint}`}>
        <Image src={imageSrc} alt={imageAlt} fill sizes="96px" className="object-contain" />
      </div>

      <div className="flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-10 h-px ${v.divider}`} />
          <span className={`text-[9px] uppercase tracking-[0.4em] font-bold ${v.label}`}>
            {label}
          </span>
        </div>

        <h3
          className={`font-serif text-2xl lg:text-3xl font-bold mb-2 tracking-tight leading-none ${v.title}`}
        >
          {title}
        </h3>
        <p className={`font-sans text-sm mb-auto max-w-[240px] ${v.description}`}>{description}</p>

        <div
          className={`flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] uppercase transition duration-200 ${v.cta}`}
        >
          <span>{cta}</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}
