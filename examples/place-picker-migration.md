<!--
  Copyright 2026 Google LLC
  SPDX-License-Identifier: Apache-2.0
-->

# Place Picker in the sample apps

The JS, Angular and React sample apps still use `<gmpx-place-picker>`. In a
local build of this library, the component uses Google's
[`PlaceAutocompleteElement`](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
instead of the legacy Autocomplete widget. The samples keep their existing
selection event and `value` handling. The React sample uses the `PlacePicker`
wrapper and its `onPlaceChange` prop for the same event.

- `type="university"` maps to `includedPrimaryTypes` and filters predictions
  by primary place type. Google lists `university` as a
  [supported place type](https://developers.google.com/maps/documentation/javascript/place-types).
- `country="us ca"` or `country={['us', 'ca']}` maps to
  `includedRegionCodes` and limits predictions to the US and Canada. The
  widget accepts up to 15
  [CLDR region codes](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement.includedRegionCodes).
- `for-map="gmap"` or `forMap="gmap"` uses the map viewport as a
  [location bias](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement.locationBias).
  This favors nearby results without restricting them to the viewport.

On `gmpx-placechange`, each app reads the picker's `value` and updates its map
and place details. Clearing the picker produces an empty value, so the sample
must clear the displayed place and restore the default map position. The JS
sample also clears its reviews data provider.

The JS sample's local start script replaces its CDN import with the bundle
built from this checkout. Opening its committed HTML directly instead loads the
version currently served by the CDN, which might not include this migration.
