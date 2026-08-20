// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/components/LogoStamp.tsx (spec §25). Optional
// deployer branding overlaid on generated pictures. The image is a bundled
// asset at /deployer-logo.png, shipped at 25×25 pixels; an operator brands
// their instance by replacing `client/public/deployer-logo.png` with their
// own 25×25 PNG and rebuilding. Our bundled default is the placeholder «37»
// mark rasterized from `public/icon.svg` (same source and same "real
// commissioned artwork deferred to Phase 8" owner decision as the PWA icons,
// T-7.1). Rendered at native 25×25 size, no CSS upscaling, so a deployer's
// pixel-level branding is preserved.
//
// Display-only overlay; not baked into the picture's pixels. Render as a
// child of a `position: relative` container holding the picture.
export default function LogoStamp() {
  return (
    <img
      src="/deployer-logo.png"
      alt=""
      aria-hidden="true"
      width={25}
      height={25}
      className="pointer-events-none absolute bottom-2 right-2 opacity-80"
    />
  );
}
