'use client';

import { useCallback, useEffect, useState } from 'react';
import type { StepProps } from '@/types/wizard';
import type { PatchworkWizardData } from '../PhotoPatchworkDialog';
import { mapClustersToFabrics } from '@/lib/photo-patchwork-engine';
import type { FabricMapping } from '@/types/photo-patchwork';

/**
 * Placeholder fabric list for auto-mapping demonstration.
 * In production this would come from the user's fabric stash via props or context.
 */
const DEMO_FABRICS: readonly {
  readonly id: string;
  readonly name: string;
  readonly primaryColor: string;
}[] = [];

export function Step4FabricMap({
  data,
  onUpdate,
}: StepProps<PatchworkWizardData>) {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Auto-map clusters to fabrics on mount
  useEffect(() => {
    if (data.palette.length > 0 && data.fabricMappings.length === 0 && DEMO_FABRICS.length > 0) {
      const mappings = mapClustersToFabrics(data.palette, DEMO_FABRICS);
      onUpdate({ fabricMappings: mappings });
    }
  }, [data.palette, data.fabricMappings.length, onUpdate]);

  const handleFabricSelect = useCallback(
    (clusterId: number, fabricId: string, fabricName: string) => {
      const cluster = data.palette[clusterId];
      if (!cluster) return;

      const updated: readonly FabricMapping[] = [
        ...data.fabricMappings.filter((m) => m.clusterId !== clusterId),
        {
          clusterId,
          clusterHex: cluster.hex,
          fabricId,
          fabricName,
        },
      ];

      onUpdate({ fabricMappings: updated });
      setOpenDropdown(null);
    },
    [data.palette, data.fabricMappings, onUpdate]
  );

  const toggleDropdown = useCallback(
    (clusterId: number) => {
      setOpenDropdown((prev) => (prev === clusterId ? null : clusterId));
    },
    []
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-secondary">
        Map each palette color to a fabric from your stash. Click a row to
        change the mapping.
      </p>

      {data.palette.length === 0 && (
        <p className="text-sm text-secondary text-center py-4">
          No palette colors yet. Go back to extract colors first.
        </p>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data.palette.map((cluster, index) => {
          const mapping = data.fabricMappings.find(
            (m) => m.clusterId === index
          );

          return (
            <div key={`fabric-map-${index}`} className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown(index)}
                className="w-full flex items-center gap-3 rounded-lg border border-outline-variant/20 px-3 py-2 hover:bg-surface-container transition-colors text-left"
              >
                {/* Cluster color swatch */}
                <div
                  className="h-8 w-8 rounded-md border border-outline-variant/20 shrink-0"
                  style={{ backgroundColor: cluster.hex }}
                />

                <span className="text-sm text-secondary mx-1">
                  &rarr;
                </span>

                {/* Mapped fabric */}
                {mapping ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-on-surface">
                      {mapping.fabricName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-secondary italic">
                    No fabric mapped
                  </span>
                )}

                <span className="ml-auto text-xs font-mono text-secondary">
                  {cluster.percentage.toFixed(1)}%
                </span>
              </button>

              {/* Fabric picker dropdown */}
              {openDropdown === index && DEMO_FABRICS.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface shadow-elevation-2 max-h-[200px] overflow-y-auto">
                  {DEMO_FABRICS.map((fabric) => (
                    <button
                      key={fabric.id}
                      type="button"
                      onClick={() =>
                        handleFabricSelect(index, fabric.id, fabric.name)
                      }
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
                    >
                      <div
                        className="h-5 w-5 rounded border border-outline-variant/20 shrink-0"
                        style={{ backgroundColor: fabric.primaryColor }}
                      />
                      <span>{fabric.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {DEMO_FABRICS.length === 0 && data.palette.length > 0 && (
        <p className="text-xs text-secondary text-center">
          Add fabrics to your stash to enable auto-mapping.
        </p>
      )}
    </div>
  );
}
