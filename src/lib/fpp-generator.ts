// TODO: Implement FPP patch parsing, sewing order computation, and mirroring

export interface FppPatch {
  svgData: string;
  order: number;
}

export function parseSvgToPatches(_svgString: string): FppPatch[] {
  return [];
}

export function computeSewingOrder(patches: FppPatch[]): FppPatch[] {
  return patches;
}

export function mirrorPatches(patches: FppPatch[], _width: number): FppPatch[] {
  return patches;
}
