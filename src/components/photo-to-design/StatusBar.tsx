import { usePhotoDesignStore, type Stage } from '@/stores/photoDesignStore';

const stages: { key: Stage; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'perspective', label: 'Perspective' },
  { key: 'calibrate', label: 'Calibrate' },
  { key: 'review', label: 'Analyze' },
];

export function StatusBar() {
  const currentStage = usePhotoDesignStore((s) => s.stage);
  const setStage = usePhotoDesignStore((s) => s.setStage);
  const canAdvance = usePhotoDesignStore((s) => s.canAdvance);

  const currentIndex = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#d4d4d4] bg-[#faf9f7] px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        {/* Back button */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => {
              const prevIndex = Math.max(0, currentIndex - 1);
              setStage(stages[prevIndex].key);
            }}
            className="rounded-full px-4 py-2 text-[14px] text-[#4a4a4a] transition-colors duration-150 hover:bg-[#ff8d49]/10 hover:text-[#ff8d49]"
          >
            ← Back
          </button>
        )}
        {currentIndex === 0 && <div className="w-16" />}

        {/* Stage progression */}
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const isActive = stage.key === currentStage;
            const isCompleted = index < currentIndex;
            const isReachable = index <= currentIndex || canAdvance(stage.key);

            return (
              <div key={stage.key} className="flex items-center">
                {/* Stage indicator */}
                <button
                  type="button"
                  disabled={!isReachable}
                  onClick={() => {
                    if (isReachable) {
                      setStage(stage.key);
                    }
                  }}
                  className={`flex h-8 min-w-[44px] items-center justify-center rounded-full px-3 text-[14px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#ff8d49] text-[#1a1a1a]'
                      : isCompleted
                        ? 'bg-[#ff8d49]/30 text-[#1a1a1a]'
                        : 'bg-[#d4d4d4]/40 text-[#4a4a4a]'
                  } ${isReachable && !isActive ? 'hover:bg-[#ff8d49]/10' : ''}`}
                >
                  {isCompleted ? '✓' : stage.label}
                </button>

                {/* Connector line */}
                {index < stages.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-4 ${
                      index < currentIndex ? 'bg-[#ff8d49]' : 'bg-[#d4d4d4]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Spacer for alignment */}
        <div className="w-16" />
      </div>
    </div>
  );
}
