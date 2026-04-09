import { ReactNode } from 'react';

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ label, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-12 group">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {label && (
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-secondary text-[10px] font-black uppercase tracking-[0.3em]">
                {label}
              </p>
            </div>
          )}
          <h1
            className="text-on-surface text-5xl md:text-6xl font-black tracking-tight leading-[1.1]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-secondary/80 text-lg font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 pt-2 md:pt-0">
            {action}
          </div>
        )}
      </div>
      <div className="mt-8 h-px w-full bg-gradient-to-r from-outline-variant via-outline-variant/50 to-transparent" />
    </div>
  );
}
