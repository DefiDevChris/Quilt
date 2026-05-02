/** Color family taxonomy for fabric filtering */
export const COLOR_FAMILIES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
  'Pink',
  'Brown',
  'Black',
  'White',
  'Gray',
  'Neutral',
  'Multi',
] as const;

/** Supported fabric manufacturers for the library */
export const FABRIC_MANUFACTURERS = [
  'Andover Fabrics',
  'Art Gallery Fabrics',
  'Basics',
  'Benartex',
  'Clothworks',
  'Free Spirit',
  'Michael Miller Fabrics',
  'Moda Fabrics',
  'Northcott',
  'Paintbrush Studio Fabrics',
  'Riley Blake Designs',
  'RJR Fabrics',
  'Robert Kaufman',
  'Spoonflower',
  'Windham Fabrics',
] as const;

/** Image size constraints for fabric assets */
export const THUMBNAIL_SIZE = 200;
export const FABRIC_IMAGE_MAX_SIZE = 2048;

/** File upload constraints */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
