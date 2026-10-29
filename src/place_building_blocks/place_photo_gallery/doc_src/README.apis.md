### Places API (New)

Photo Gallery loads the photos of its place through Places API (New), the same API the Place Data Provider component uses. It needs no other API.

#### Documentation

[Place Photos documentation](https://developers.google.com/maps/documentation/javascript/place-photos). Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

The gallery asks its Place Data Provider for `displayName` and `photos`, so that request is billed at [Places API Place Details Pro](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-pro-sku) or higher (see the Place Data Provider's pricing).

- [SKU: Places API Place Details Photos](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-photo-new-ent-sku) (one per tile; one for the first photo at full size, which loads with the tiles before the lightbox opens; and one for each further photo opened in the lightbox)