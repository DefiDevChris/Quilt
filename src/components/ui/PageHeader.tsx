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
              <span className="w-1.5 h-1.5 rounded-lg bg-[#ff8d49] animate-pulse" />
              <p className="text-[#4a4a4a] text-[14px] leading-[20px] font-normal">
                {label}
              </p>
            </div>
          )}
          <h1
            className="text-[#1a1a1a] text-[40px] leading-[52px] font-normal"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-[#4a4a4a] text-[18px] leading-[28px] font-normal">
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
      <div className="mt-8 h-px w-full bg-[#d4d4d4]" />
    </div>
  );
}
