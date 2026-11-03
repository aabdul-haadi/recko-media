import { galleryModes, galleryPosition } from "./gallery-layout";

const PERSPECTIVE = 1100;
const CARD_HALF_DIAGONAL = Math.hypot(134 / 2, 188 / 2) + 6;

/** Bounds every card corner during rotation and between any two arrangements.
 * Interpolated positions stay inside this sphere, regardless of card orientation.
 */
export function galleryEnvelope(count = 12): number {
  return Math.max(
    ...galleryModes.flatMap((mode) =>
      Array.from({ length: count }, (_, index) => {
        const { x, y, z } = galleryPosition(mode, index, count);
        return Math.hypot(x, y, z) + CARD_HALF_DIAGONAL;
      }),
    ),
  );
}
const GALLERY_RADIUS = galleryEnvelope();

export function fitGallery(width: number, height: number): number {
  const halfSpace = Math.max(0, (Math.min(width, height) - 48) / 2);
  // Perspective magnifies positive z: solve sR / (1 - sR/P) <= halfSpace.
  return Math.min(1, (halfSpace * PERSPECTIVE) / (GALLERY_RADIUS * (PERSPECTIVE + halfSpace)));
}

export function stackOffset(index: number, active: number, count: number): number {
  const half = Math.floor(count / 2);
  return ((index - active + half + count) % count) - half;
}

export function fitPreviewStack(width: number, height: number): number {
  const halfWidth = Math.max(0, (width - 32) / 2);
  const halfHeight = Math.max(0, (height - 24) / 2);
  // Seven centered cards: +-129px, 75px half-width, 105px half-height.
  // Rotation can bring a corner at most 31px towards the 900px camera.
  return Math.min(
    1,
    (halfWidth * 900) / (204 * 900 + halfWidth * 31),
    (halfHeight * 900) / (105 * 900 + halfHeight * 31),
  );
}
