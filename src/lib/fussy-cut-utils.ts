export interface FussyCutConfig {
  scaleX: number;
  scaleY: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export function computePatternTransform(
  config: FussyCutConfig
): [number, number, number, number, number, number] {
  const { scaleX, scaleY, rotation, offsetX, offsetY } = config;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad) * scaleX;
  const sin = Math.sin(rad) * scaleY;
  return [cos, sin, -sin, cos, offsetX, offsetY];
}
