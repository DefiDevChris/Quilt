'use client';

interface OnboardingSpotlightProps {
  readonly targetRect: DOMRect | null;
}

const PADDING = 8;

export function OnboardingSpotlight({ targetRect }: OnboardingSpotlightProps) {
  const hasTarget = targetRect !== null;

  return (
    <svg
      className="fixed inset-0 z-[60] pointer-events-none"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <mask id="onboarding-spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {hasTarget && (
            <rect
              x={targetRect.left - PADDING}
              y={targetRect.top - PADDING}
              width={targetRect.width + PADDING * 2}
              height={targetRect.height + PADDING * 2}
              rx="8"
              fill="black"
            />
          )}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="black"
        opacity="0.5"
        mask="url(#onboarding-spotlight-mask)"
      />
    </svg>
  );
}
