'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageFlag, setStorageFlag } from '@/lib/onboarding-utils';

interface ContextualTooltipProps {
  readonly toolId: string;
  readonly message: string;
  readonly visible: boolean;
}

export function ContextualTooltip({ toolId, message, visible }: ContextualTooltipProps) {
  const [show, setShow] = useState(false);
  const storageKey = `quiltcorgi-tooltip-seen-${toolId}`;

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }

    const alreadySeen = getStorageFlag(storageKey);
    if (alreadySeen) return;

    setShow(true);
    setStorageFlag(storageKey, true);

    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, [visible, storageKey]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 rounded-lg bg-surface shadow-elevation-3 border border-outline-variant/20 whitespace-nowrap"
          onClick={() => setShow(false)}
        >
          <p className="text-xs text-on-surface">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
