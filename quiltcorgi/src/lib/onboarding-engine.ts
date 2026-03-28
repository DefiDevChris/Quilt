import type { TourStep } from '@/types/onboarding';
import { ONBOARDING_STORAGE_KEY, TOOLTIP_DELAY_MS } from '@/lib/constants';

export { ONBOARDING_STORAGE_KEY, TOOLTIP_DELAY_MS };

// --- Tour Steps ---

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to QuiltCorgi!',
    description:
      'Let us show you around the design studio. This quick tour will help you get started with your first quilt design.',
    targetSelector: '',
    placement: 'bottom',
  },
  {
    id: 'worktable-switcher',
    title: 'Worktable Switcher',
    description:
      'Switch between four worktables: Quilt for full layouts, Block for individual blocks, Image for reference photos, and Print for export.',
    targetSelector: '[data-tour="worktable-switcher"]',
    placement: 'bottom',
    showPointer: true,
  },
  {
    id: 'toolbar',
    title: 'Tool Rail',
    description:
      'Your drawing tools live here. Select shapes, draw lines, curves, and text. Each tool has a keyboard shortcut shown in its tooltip.',
    targetSelector: '[data-tour="toolbar"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'block-library',
    title: 'Block Library',
    description:
      'Browse over 650 quilt blocks organized by category. Drag blocks directly onto your canvas to start designing.',
    targetSelector: '[data-tour="block-library"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'fabric-library',
    title: 'Fabric Library',
    description:
      'Upload your own fabric photos or choose from built-in swatches. Drag fabrics onto patches to colorize your design.',
    targetSelector: '[data-tour="fabric-library"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'canvas',
    title: 'Canvas Area',
    description:
      'This is your design workspace. Zoom with scroll wheel, pan by holding Space and dragging. Right-click for context actions.',
    targetSelector: '[data-tour="canvas"]',
    placement: 'left',
    showPointer: true,
  },
  {
    id: 'layout-settings',
    title: 'Layout Settings',
    description:
      'Choose grid, sashing, on-point, medallion, or lone star layouts. Set row and column counts, block sizes, and sashing widths.',
    targetSelector: '[data-tour="layout-settings"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'export',
    title: 'Export Options',
    description:
      'Export your design as a printable PDF with cutting charts, yardage estimates, and templates, or save as a high-resolution image.',
    targetSelector: '[data-tour="export"]',
    placement: 'right',
    showPointer: true,
  },
  {
    id: 'ready',
    title: "You're Ready!",
    description:
      'You now know the essentials. Press "?" in the top-right corner anytime for help, shortcuts, and FAQs. Happy quilting!',
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
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setStorageFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
