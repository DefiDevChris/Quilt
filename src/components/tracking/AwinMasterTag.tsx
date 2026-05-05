/**
 * Awin MasterTag / DWIN Tracking Pixel
 *
 * Required by Awin for conversion attribution. Loads the Awin tracking
 * JavaScript on every page so Awin can attribute referred conversions
 * back to the QuiltCorgi publisher account.
 *
 * Only renders when NEXT_PUBLIC_AWIN_PUBLISHER_ID is set.
 * In development, the script tag is omitted entirely.
 */

const publisherId = process.env.NEXT_PUBLIC_AWIN_PUBLISHER_ID;

export function AwinMasterTag() {
  if (!publisherId) return null;

  return (
    <script
      src={`https://www.dwin1.com/${publisherId}.js`}
      defer
      data-awin-publisher-id={publisherId}
    />
  );
}
