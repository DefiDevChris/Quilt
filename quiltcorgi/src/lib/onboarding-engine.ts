import type { TourStep } from '@/types/onboarding';
import { ONBOARDING_STORAGE_KEY, TOOLTIP_DELAY_MS } from '@/lib/constants';

export { ONBOARDING_STORAGE_KEY, TOOLTIP_DELAY_MS };

// --- Tour Steps ---

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to QuiltCorgi!',
    description:
      'Let us show you around the studio. This quick tour covers the essentials so you can jump right into your first design.',
    targetSelector: '',
    placement: 'bottom',
  },
  {
    id: 'worktable-switcher',
    title: 'Your Worktables',
    description:
      'Switch between four worktables: Quilt for full layouts, Block for drafting individual blocks, Image for fabric photos, and Print for exporting patterns.',
    targetSelector: '[data-tour="worktable-switcher"]',
    placement: 'bottom',
    showPointer: true,
  },
  {
    id: 'toolbar',
    title: 'Drawing Tools',
    description:
      'Your drawing tools live here — shapes, lines, curves, and text. Each one has a keyboard shortcut shown in its tooltip.',
    targetSelector: '[data-tour="toolbar"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'block-library',
    title: 'Block Library',
    description:
      'Browse over 650 quilt blocks organized by category. Drag any block straight onto your canvas to start building your design.',
    targetSelector: '[data-tour="block-library"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'fabric-library',
    title: 'Fabric Library',
    description:
      'Upload your own fabric photos or pick from built-in swatches. Drag a fabric onto any patch to see it come to life.',
    targetSelector: '[data-tour="fabric-library"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'canvas',
    title: 'Your Canvas',
    description:
      'This is where the magic happens. Scroll to zoom, hold Space and drag to pan, and right-click for quick actions.',
    targetSelector: '[data-tour="canvas"]',
    placement: 'left',
    showPointer: true,
  },
  {
    id: 'layout-settings',
    title: 'Layout Settings',
    description:
      'Set up your quilt layout — grid, sashing, or on-point. Adjust rows, columns, block sizes, and sashing widths.',
    targetSelector: '[data-tour="layout-settings"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'export',
    title: 'Export & Print',
    description:
      'When you are ready, export your design as a true-scale PDF with cutting charts, yardage estimates, and seam allowances — or save as a high-res image.',
    targetSelector: '[data-tour="export"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description:
      'That covers the basics. Press "?" anytime for help, shortcuts, and FAQs. Now go make something beautiful!',
    targetSelector: '',
    placement: 'bottom',
  },
] as const;

// --- Position computation ---

export interface TooltipPosition {
  readonly x: number;
  readonly y: number;
}

export function computeTooltipPosition(
  targetRect: DOMRect,
  placement: string,
  tooltipSize: { w: number; h: number }
): TooltipPosition {
  const gap = 12;

  switch (placement) {
    case 'top':
      return {
        x: targetRect.left + targetRect.width / 2 - tooltipSize.w / 2,
        y: targetRect.top - tooltipSize.h - gap,
      };
    case 'bottom':
      return {
        x: targetRect.left + targetRect.width / 2 - tooltipSize.w / 2,
        y: targetRect.bottom + gap,
      };
    case 'left':
      return {
        x: targetRect.left - tooltipSize.w - gap,
        y: targetRect.top + targetRect.height / 2 - tooltipSize.h / 2,
      };
    case 'right':
      return {
        x: targetRect.right + gap,
        y: targetRect.top + targetRect.height / 2 - tooltipSize.h / 2,
      };
    default:
      return {
        x: targetRect.left + targetRect.width / 2 - tooltipSize.w / 2,
        y: targetRect.bottom + gap,
      };
  }
}

// --- Storage helpers ---

export function getStorageFlag(key: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setStorageFlag(key: string, value: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, String(value));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
