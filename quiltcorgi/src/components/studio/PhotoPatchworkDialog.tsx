'use client';

import { WizardDialog } from '@/components/ui/WizardDialog';
import type { WizardStep, WizardConfig } from '@/types/wizard';
import type { ColorCluster, PatchworkGrid, FabricMapping } from '@/types/photo-patchwork';
import { Step1Upload } from './photo-patchwork/Step1Upload';
import { Step2GridSize } from './photo-patchwork/Step2GridSize';
import { Step3Colors } from './photo-patchwork/Step3Colors';
import { Step4FabricMap } from './photo-patchwork/Step4FabricMap';
import { Step5Preview } from './photo-patchwork/Step5Preview';

// ---------------------------------------------------------------------------
// Wizard data type
// ---------------------------------------------------------------------------

export interface PatchworkWizardData {
  imageData: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null;
  imagePreviewUrl: string;
  gridWidth: number;
  gridHeight: number;
  colorCount: number;
  palette: readonly ColorCluster[];
  grid: PatchworkGrid | null;
  fabricMappings: readonly FabricMapping[];
}

// ---------------------------------------------------------------------------
// Default initial data
// ---------------------------------------------------------------------------

const INITIAL_DATA: PatchworkWizardData = {
  imageData: null,
  imagePreviewUrl: '',
  gridWidth: 16,
  gridHeight: 16,
  colorCount: 8,
  palette: [],
  grid: null,
  fabricMappings: [],
};

// ---------------------------------------------------------------------------
// Wizard steps
// ---------------------------------------------------------------------------

const STEPS: readonly WizardStep<PatchworkWizardData>[] = [
  {
    id: 'upload',
    title: 'Upload Photo',
    description: 'Choose an image to convert into a quilt patchwork pattern.',
    component: Step1Upload,
    validate: (data) =>
      data.imageData ? true : 'Please upload an image before continuing.',
  },
  {
    id: 'grid-size',
    title: 'Grid Size',
    description: 'Set the number of rows and columns for your patchwork grid.',
    component: Step2GridSize,
    validate: (data) => {
      if (data.gridWidth < 4 || data.gridWidth > 48) {
        return 'Grid width must be between 4 and 48.';
      }
      if (data.gridHeight < 4 || data.gridHeight > 48) {
        return 'Grid height must be between 4 and 48.';
      }
      return true;
    },
  },
  {
    id: 'colors',
    title: 'Extract Colors',
    description: 'Choose how many colors to extract from the photo.',
    component: Step3Colors,
    validate: (data) =>
      data.palette.length > 0
        ? true
        : 'Please wait for color extraction to complete.',
  },
  {
    id: 'fabric-map',
    title: 'Map Fabrics',
    description: 'Optionally map each color to a fabric from your stash.',
    component: Step4FabricMap,
    optional: true,
  },
  {
    id: 'preview',
    title: 'Preview',
    description: 'Review your patchwork grid before adding it to the canvas.',
    component: Step5Preview,
    validate: (data) =>
      data.grid ? true : 'Please wait for the grid to generate.',
  },
];

// ---------------------------------------------------------------------------
// Wizard config
// ---------------------------------------------------------------------------

const WIZARD_CONFIG: WizardConfig = {
  title: 'Photo Patchwork',
  subtitle: 'Turn a photo into a pixelated quilt grid',
  width: 600,
  finishLabel: 'Add to Canvas',
  showProgress: true,
  allowSkip: true,
};

// ---------------------------------------------------------------------------
// Dialog component
// ---------------------------------------------------------------------------

interface PhotoPatchworkDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onFinish: (data: PatchworkWizardData) => void;
}

export function PhotoPatchworkDialog({
  isOpen,
  onClose,
  onFinish,
}: PhotoPatchworkDialogProps) {
  return (
    <WizardDialog<PatchworkWizardData>
      isOpen={isOpen}
      onClose={onClose}
      onFinish={onFinish}
      steps={STEPS}
      config={WIZARD_CONFIG}
      initialData={INITIAL_DATA}
    />
  );
}
