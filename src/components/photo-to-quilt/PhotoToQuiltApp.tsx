'use client';

import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import WizardStepUpload from './WizardStepUpload';
import WizardStepBackground from './WizardStepBackground';
import WizardStepCanvas from './WizardStepCanvas';

export default function PhotoToQuiltApp() {
  const wizardStep = usePhotoToQuiltStore((s) => s.wizardStep);

  switch (wizardStep) {
    case 'upload':
      return <WizardStepUpload />;
    case 'background':
      return <WizardStepBackground />;
    case 'canvas':
      return <WizardStepCanvas />;
    default:
      return <WizardStepUpload />;
  }
}
