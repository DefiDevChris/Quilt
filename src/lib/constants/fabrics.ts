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

/** Tonal value categories for fabric selection */
export const FABRIC_VALUES = ['Light', 'Medium', 'Dark'] as const;

/** Sort options for the fabric browser */
export const FABRIC_SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'manufacturer', label: 'Brand' },
  { value: 'colorFamily', label: 'Color' },
  { value: 'value', label: 'Value' },
] as const;

/** Image size constraints for fabric assets */
export const THUMBNAIL_SIZE = 200;
export const FABRIC_IMAGE_MAX_SIZE = 2048;

/** File upload constraints */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
