'use client';

import { useCallback } from 'react';
import { WizardDialog } from '@/components/ui/WizardDialog';
import type { WizardStep, WizardConfig, StepProps } from '@/types/wizard';
import type { DetectedGrid, RecognizedBlock, BlockColorInfo, QuiltMeasurements } from '@/types/quilt-ocr';
import { Step1Upload } from '@/components/studio/quilt-ocr/Step1Upload';
import { Step2Analysis } from '@/components/studio/quilt-ocr/Step2Analysis';
import { Step3Grid } from '@/components/studio/quilt-ocr/Step3Grid';
import { Step4Blocks } from '@/components/studio/quilt-ocr/Step4Blocks';
import { Step5Measurements } from '@/components/studio/quilt-ocr/Step5Measurements';
import { Step6Colors } from '@/components/studio/quilt-ocr/Step6Colors';
import { Step7Preview } from '@/components/studio/quilt-ocr/Step7Preview';

export interface OcrWizardData {
  readonly imageData: {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
  } | null;
  readonly imagePreviewUrl: string;
  readonly grid: DetectedGrid | null;
  readonly blocks: readonly RecognizedBlock[];
  readonly colors: readonly BlockColorInfo[];
  readonly measurements: QuiltMeasurements | null;
  readonly referenceWidthInches: number;
  readonly analysisComplete: boolean;
}

const INITIAL_DATA: OcrWizardData = {
  imageData: null,
  imagePreviewUrl: '',
  grid: null,
  blocks: [],
  colors: [],
  measurements: null,
  referenceWidthInches: 60,
  analysisComplete: false,
};

const WIZARD_CONFIG: WizardConfig = {
  title: 'Import from Photo',
  subtitle: 'Reconstruct a quilt design from a photograph',
  width: 640,
  finishLabel: 'Import to Canvas',
  showProgress: true,
};

const steps: readonly WizardStep<OcrWizardData>[] = [
  {
    id: 'upload',
    title: 'Upload Photo',
    description: 'Upload a photo of a quilt to analyze',
    component: Step1Upload as React.ComponentType<StepProps<OcrWizardData>>,
    validate: (data) => (data.imageData ? true : 'Please upload a photo'),
  },
  {
    id: 'analysis',
    title: 'Analyzing...',
    description: 'Detecting layout, blocks, and colors',
    component: Step2Analysis as React.ComponentType<StepProps<OcrWizardData>>,
    validate: (data) => (data.analysisComplete ? true : 'Analysis in progress'),
  },
  {
    id: 'grid',
    title: 'Review Layout',
    description: 'Verify the detected grid structure',
    component: Step3Grid as React.ComponentType<StepProps<OcrWizardData>>,
    validate: (data) => (data.grid ? true : 'No grid detected'),
  },
  {
    id: 'blocks',
    title: 'Review Blocks',
    description: 'Confirm block pattern matches',
    component: Step4Blocks as React.ComponentType<StepProps<OcrWizardData>>,
  },
  {
    id: 'measurements',
    title: 'Set Measurements',
    description: 'Enter a known measurement to scale the design',
    component: Step5Measurements as React.ComponentType<StepProps<OcrWizardData>>,
  },
  {
    id: 'colors',
    title: 'Review Colors',
    description: 'Confirm color and fabric assignments',
    component: Step6Colors as React.ComponentType<StepProps<OcrWizardData>>,
  },
  {
    id: 'preview',
    title: 'Preview & Import',
    description: 'Review the reconstructed design',
    component: Step7Preview as React.ComponentType<StepProps<OcrWizardData>>,
  },
];

interface QuiltPhotoImportWizardProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onImport: (data: OcrWizardData) => void;
}

export function QuiltPhotoImportWizard({
  isOpen,
  onClose,
  onImport,
}: QuiltPhotoImportWizardProps) {
  const handleFinish = useCallback(
    (data: OcrWizardData) => {
      onImport(data);
      onClose();
    },
    [onImport, onClose]
  );

  return (
    <WizardDialog
      isOpen={isOpen}
      onClose={onClose}
      onFinish={handleFinish}
      steps={steps}
      config={WIZARD_CONFIG}
      initialData={INITIAL_DATA}
    />
  );
}
