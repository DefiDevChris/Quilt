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
              <span className="w-1.5 h-1.5 rounded-lg bg-primary animate-pulse" />
              <p className="text-dim text-[14px] leading-[20px] font-normal">{label}</p>
            </div>
          )}
          <h1
            className="text-default text-[40px] leading-[52px] font-normal"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-dim text-[18px] leading-[28px] font-normal">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0 pt-2 md:pt-0">{action}</div>}
      </div>
      <div className="mt-8 border-b border-default w-full" />
    </div>
  );
}
