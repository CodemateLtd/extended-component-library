### Places API (New)

Used when fetching Places data for the place specified via attribute/property.

#### Documentation

* When using the Maps JavaScript API beta version (default): [Place class documentation](https://developers.google.com/maps/documentation/javascript/place)
* When using the Maps JavaScript API GA version: [Place details documentation](https://developers.google.com/maps/documentation/javascript/examples/place-details)

Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

Each fetch is one Place Details request, billed at a single SKU: the one for the most expensive field requested. The fields come from the `fields` attribute, or else from the Place Building Blocks inside this component; the list below names the building blocks that raise the request to each SKU. The SKUs are not triggered if you provide a `Place` or `PlaceResult` object to this component that contains all the data fields necessary to render children's content, or if this component has the `auto-fetch-disabled` attribute.

For a place with opening hours, `<gmpx-place-opening-hours>` and `<gmpx-place-field-boolean>` with `isOpen()` also make a separate request for its current opening hours, billed as [Places API Place Details Enterprise](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-sku). They make it even when this component doesn't fetch, unless the `Place` you provide already has `currentOpeningHours`. The photos that `<gmpx-place-photo-gallery>` loads are billed separately too, as [Places API Place Details Photos](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-photo-new-ent-sku).

- [SKU: Places API Place Details Essentials](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ess-sku) (`<gmpx-place-field-text>` with `formattedAddress`, `location`, `plusCode`, or `types`)
- [SKU: Places API Place Details Pro](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-pro-sku) (`<gmpx-place-directions-button>`, `<gmpx-place-photo-gallery>`, `<gmpx-place-field-boolean>` with `hasWheelchairAccessibleEntrance`, `<gmpx-place-field-link>` with `googleMapsURI`, `<gmpx-place-field-text>` with `businessStatus` or `displayName`)
- [SKU: Places API Place Details Enterprise](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-sku) (`<gmpx-place-opening-hours>`, `<gmpx-place-price-level>`, `<gmpx-place-rating>`, `<gmpx-place-field-boolean>` with `isOpen()`, `<gmpx-place-field-link>` with `websiteURI`, `<gmpx-place-field-text>` with `internationalPhoneNumber`, `nationalPhoneNumber`, `rating`, or `userRatingCount`)
- [SKU: Places API Place Details Enterprise + Atmosphere](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-plus-sku) (`<gmpx-place-reviews>`, `<gmpx-place-field-boolean>` with any other field, such as `hasDineIn`)
