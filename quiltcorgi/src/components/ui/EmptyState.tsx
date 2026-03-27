interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'projects' | 'community' | 'moderation' | 'notifications';
}

function EmptyIcon({ icon }: { icon?: EmptyStateProps['icon'] }) {
  switch (icon) {
    case 'projects':
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-secondary"
          aria-hidden="true"
        >
          <rect
            x="20"
            y="20"
            width="24"
            height="24"
            rx="2"
            transform="rotate(45 32 32)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <line
            x1="32"
            y1="15"
            x2="32"
            y2="49"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <line
            x1="15"
            y1="32"
            x2="49"
            y2="32"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );
    case 'community':
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-secondary"
          aria-hidden="true"
        >
          <path
            d="M32 54s-18-10-18-24a12 12 0 0 1 18-10.4A12 12 0 0 1 50 30c0 14-18 24-18 24z"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
      );
    case 'moderation':
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-secondary"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r="22"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <path
            d="M22 32l7 7 13-14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'notifications':
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-secondary"
          aria-hidden="true"
        >
          <path
            d="M32 10c-9 0-16 7-16 16v10l-4 6h40l-4-6V26c0-9-7-16-16-16z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M28 46a4 4 0 0 0 8 0" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-secondary"
          aria-hidden="true"
        >
          <rect
            x="20"
            y="20"
            width="24"
            height="24"
            rx="2"
            transform="rotate(45 32 32)"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="26"
            y="26"
            width="12"
            height="12"
            rx="1"
            transform="rotate(45 32 32)"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
  }
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6">
        <EmptyIcon icon={icon} />
      </div>
      <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
      <p className="text-secondary text-center max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 bg-primary text-primary-on px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
