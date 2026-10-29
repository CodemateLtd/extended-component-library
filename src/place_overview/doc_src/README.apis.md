### Places API (New)

Used when fetching Places data for the place specified via attribute/property.

#### Documentation

* Fetching Places data:
    * Maps JavaScript API beta version (default): [Place class documentation](https://developers.google.com/maps/documentation/javascript/place)
    * Maps JavaScript API GA version: [Place details documentation](https://developers.google.com/maps/documentation/javascript/examples/place-details)
* Displaying Places photos (used in medium, large, and x-large sizes): [Photos documentation](https://developers.google.com/maps/documentation/javascript/place-photos)

Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

Note that the SKUs below (except Places API Place Details Photos, and the separate request for the place's current opening hours) are not triggered if you provide a `Place` or `PlaceResult` object to this component that contains all the data fields necessary to render its overview content, or if this component has the `auto-fetch-disabled` attribute.

- [SKU: Places API Place Details Enterprise](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-sku) (`x-small`; in every other size, for a place with opening hours, a separate request for its current opening hours: one in `small`, `medium`, and `large`, two in `x-large`)
- [SKU: Places API Place Details Enterprise + Atmosphere](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-plus-sku) (all sizes except `x-small`)
- [SKU: Places API Place Details Photos](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-photo-new-ent-sku) (`medium`: two, the tile and the first photo at full size; `large` and `x-large`: one per tile plus the first photo at full size; in all three, one more for each further photo opened in the lightbox)

### Routes API

Used when computing travel distance/duration from an origin.

#### Documentation

[Routes API documentation](https://developers.google.com/maps/documentation/javascript/routes). Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

Note that the SKU below is only triggered if you specify a travel origin, and whenever the origin or travel mode changes.

- [SKU: Routes: Compute Routes Essentials](https://developers.google.com/maps/billing-and-pricing/pricing#routes-pricing) (all sizes)
