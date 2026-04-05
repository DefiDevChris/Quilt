'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getStorageFlag, setStorageFlag } from '@/lib/onboarding-utils';

interface ContextualTooltipProps {
  readonly toolId: string;
  readonly message: string;
  readonly visible: boolean;
}

export function ContextualTooltip({ toolId, message, visible }: ContextualTooltipProps) {
  const storageKey = `quiltcorgi-tooltip-seen-${toolId}`;
  const alreadySeen = typeof window !== 'undefined' && getStorageFlag(storageKey);
  const show = visible && !alreadySeen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-lg bg-surface shadow-elevation-3 border border-outline-variant/20 whitespace-nowrap"
          onClick={() => {
            setStorageFlag(storageKey, true);
          }}
        >
          <p className="text-xs text-on-surface">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
