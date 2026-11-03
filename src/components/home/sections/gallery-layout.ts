export const galleryModes = ["Helix", "Barrel", "Ring", "Sphere"] as const;
export type GalleryMode = (typeof galleryModes)[number];
export type GalleryPosition = {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
};

/** Deterministic arrangements in local 3D space; stage scales as one unit on mobile. */
export function galleryPosition(mode: GalleryMode, index: number, count: number): GalleryPosition {
  const radius = 230;
  const angle = (index / Math.max(1, count)) * Math.PI * 2;
  const degrees = (angle * 180) / Math.PI;
  const base = { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 };
  if (mode === "Helix")
    return {
      ...base,
      x: Math.sin(angle) * radius,
      y: (index - (count - 1) / 2) * 26,
      z: Math.cos(angle) * radius,
      rotationY: degrees,
    };
  if (mode === "Barrel")
    return {
      ...base,
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      rotationY: degrees,
    };
  if (mode === "Ring")
    return {
      ...base,
      x: Math.sin(angle) * radius * 1.25,
      y: -Math.cos(angle) * radius * 0.85,
      rotationZ: degrees,
    };
  const vertical = 1 - (2 * (index + 0.5)) / Math.max(1, count);
  const latitudeRadius = Math.sqrt(Math.max(0, 1 - vertical * vertical));
  const longitude = index * Math.PI * (3 - Math.sqrt(5));
  const x = radius * latitudeRadius * Math.cos(longitude);
  const z = radius * latitudeRadius * Math.sin(longitude);
  return {
    ...base,
    x,
    y: vertical * radius,
    z,
    rotationX: (-Math.asin(vertical) * 180) / Math.PI,
    rotationY: (Math.atan2(x, z) * 180) / Math.PI,
  };
}
