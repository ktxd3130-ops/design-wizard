# OpenMage API Integration Guide

## Overview
This architectural guide outlines the final JSON contract produced by the Design Wizard UI when a User clicks **Add to Cart**. This artifact replaces standard WooCommerce/Shopify meta with a headless, vector-first design snapshot optimized for print automation and OpenMage rendering.

## The Contract Endpoint
When the "Add to Cart" function fires, the Integrator will post `OpenMagePayload` directly to the OpenMage ingestion queue.

### Expected Payload Shape

```json
{
  "design_id": "uuid-v4-string",
  "system_metadata": {
    "browser": "Mozilla/5.0 ...",
    "timestamp": "2026-03-03T12:00:00.000Z",
    "design_version": 1
  },
  "design_state": {
    "version": 1,
    "canvasWidth": 800,
    "canvasHeight": 600,
    "safeZoneMargin": 20,
    "objects": [
      {
        "type": "path",
        "left": 100,
        "top": 100,
        "width": 300,
        "height": 300,
        "s3Url": "s3://production-vectors/1234.svg",
        "zIndex": 1
      },
      {
        "type": "textbox",
        "text": "Hello World",
        "placeholderKey": "{{USER_NAME}}",
        "fontFamily": "impact",
        "fontSize": 48,
        "fill": "#000000"
      }
    ],
    "warnings": []
  },
  "is_orderable": true
}
```

## Production Flow

1. **Blob to S3 Migration:** During UI construction, images use local `proxyUrl` blob storage. Once dropped, they upload synchronously to S3. The payload contains `s3Url` which strictly references the production-grade asset.
2. **Infinite Scale SVGs:** If an image is vectorized, the exported `objects` array switches the entity `type` to `path` and associates the SVG string directly to `s3Url` / `highResUrl`.
3. **Template Mapping:** OpenMage can inspect the `placeholderKey` of `textbox` elements (e.g., `{{COMPANY}}`). If this design represents a static B2B template, the backend can auto-hydrate new orders with buyer data prior to RIP (Raster Image Processor) translation.

## Validation Strictness
`is_orderable` will only ever be `true` if the UI's local Print Validation engine guarantees that **no** objects contain a DPI under 150 (`qualityWarning: false`) and **no** objects leak outside the print bleed `safeZoneMargin`.

If `is_orderable` is `false`, the cart engine is expected to either throw an error flag to the Print Admin or halt ingestion entirely.
