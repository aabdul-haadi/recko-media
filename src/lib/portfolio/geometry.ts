export type View = { scale: number; x: number; y: number };
export type Bounds = { width: number; height: number; imageWidth: number; imageHeight: number };
export const initialView: View = { scale: 1, x: 0, y: 0 };
export function containImage(
  width: number,
  height: number,
  stageWidth: number,
  stageHeight: number,
) {
  const ratio = Math.min(stageWidth / width, stageHeight / height, 1);
  return { width: width * ratio, height: height * ratio };
}
export function boundView(view: View, bounds: Bounds): View {
  const scale = Math.max(1, Math.min(12, view.scale));
  const maxX = Math.max(0, (bounds.imageWidth * scale - bounds.width) / 2);
  const maxY = Math.max(0, (bounds.imageHeight * scale - bounds.height) / 2);
  return {
    scale,
    x: Math.max(-maxX, Math.min(maxX, view.x)),
    y: Math.max(-maxY, Math.min(maxY, view.y)),
  };
}
export function zoomAt(view: View, factor: number, x: number, y: number, bounds: Bounds): View {
  const scale = Math.max(1, Math.min(12, view.scale * factor));
  const ratio = scale / view.scale;
  return boundView({ scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio }, bounds);
}
