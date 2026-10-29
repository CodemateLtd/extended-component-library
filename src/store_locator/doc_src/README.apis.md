
### Maps JavaScript API

Used to display a map.

#### Documentation

[Adding a map to your website with Web Components](https://developers.google.com/maps/documentation/javascript/web-components/overview)

#### Pricing

* [SKU: Dynamic Maps](https://developers.google.com/maps/billing-and-pricing/sku-details#dynamic-maps-ess-sku)

### Places API (New)

This component uses the Places API (New) in two ways:

1. Places Autocomplete to help an end user specify their location (intermediate and advanced feature sets only).
2. Place Details to view more information about a selected listing (advanced feature set only).

#### Documentation

* Autocomplete search for the end user's location (intermediate and advanced feature sets only):
  * [Place Autocomplete Widget documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
* Fetching Places data for the "view details" panel (advanced feature set only):
  * [Place class documentation](https://developers.google.com/maps/documentation/javascript/place)
  * Displaying Places photos (advanced feature set only): [Photos documentation](https://developers.google.com/maps/documentation/javascript/place-photos)

Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

- [SKU: Autocomplete Session Usage](https://developers.google.com/maps/billing-and-pricing/sku-details#autocomplete-session-new-ess-sku)
- [SKU: Autocomplete Requests](https://developers.google.com/maps/billing-and-pricing/sku-details#places_autocomplete-request-new-ess-sku) (sessions that end without a selection)
- [SKU: Places API Place Details Enterprise + Atmosphere](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-plus-sku) (the selected place, which ends the session; and the "view details" panel, advanced feature set only)
- [SKU: Find Place](https://developers.google.com/maps/billing-and-pricing/pricing#find-place) (fallback query)
- [SKU: Places API Text Search Essentials (IDs Only)](https://developers.google.com/maps/billing-and-pricing/sku-details#places_text-search-id-only-ess-sku) (when the user presses Enter without picking a suggestion; no charge)
- [SKU: Places API Place Details Pro](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-pro-sku) (the place that search finds)
- [SKU: Places API Place Details Photos](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-photo-new-ent-sku) (the "view details" panel, advanced feature set only: one per tile, plus the first photo at full size, plus one for each further photo opened in the lightbox)

### Routes API

This component uses the Routes API in two ways:

1. Route Matrix to sort and display travel distances from the end user's location (intermediate and advanced feature sets only).
2. Compute Routes to display a route from the end user's location to the selected listing (advanced feature set only).

#### Documentation

[Routes API documentation](https://developers.google.com/maps/documentation/javascript/routes). Please be sure to check this documentation for additional requirements and recommendations regarding your use.

#### Pricing

- [SKU: Routes: Compute Route Matrix Essentials](https://developers.google.com/maps/billing-and-pricing/pricing#routes-pricing)
- [SKU: Routes: Compute Routes Essentials](https://developers.google.com/maps/billing-and-pricing/pricing#routes-pricing)
