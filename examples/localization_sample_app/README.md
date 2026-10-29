# Localization Sample App

This directory contains a simple JS app that shows the Extended Component
Library in Spanish. It displays details of the Museo Nacional del Prado in
Madrid, and a Place Picker to look up other places in Madrid.

The text on the page comes from two sources, and each is localized separately:

- The library's own text, such as "Open now" and the photo gallery's ARIA
  labels, comes from its string literals. The app replaces them with
  `setStringLiterals()`, imported from the same bundle URL as the page's
  `<script>` tag. See [`src/base/strings.ts`](../../src/base/strings.ts) for
  every key.
- Text returned by Google Maps Platform, such as place names, addresses and
  reviews, follows the `language` attribute of `<gmpx-api-loader>`. The app
  sets `language="es"` and `region="ES"`. Without `language`, the Maps
  JavaScript API uses the browser's preferred language. See
  [Localize the Map](https://developers.google.com/maps/documentation/javascript/localization).

Opening and closing times, and their weekday names, are formatted in the
browser's locale, not the loader's `language`. In an English-language browser
they appear as, for example, "Cierra: 8:00 PM" or "Abre: Mon 10:00 AM".

The Place Picker shows these less common options:

- `location-bias="40.4168,-3.7038"` and `radius="10000"` favor places within
  10 km of central Madrid. Places outside the circle can still be suggested.
- The checkbox sets the picker's `strictBounds` property. With strict bounds,
  only places inside the rectangle that encloses the circle are suggested,
  because Place Autocomplete can only be restricted to a rectangle. A search
  run with the Enter key or the search button is still only biased towards
  the circle.
- A `gmpx-requesterror` listener shows a message under the picker when a
  request for suggestions, a search or place details fails.

To favor the viewport of a `<gmp-map>` instead, set the picker's `for-map`
attribute, as the other sample apps do. For a `google.maps.Map` created in
code, call the picker's `bindTo(map)` method. While bound, the map's viewport
takes precedence over `location-bias` and `radius`.

Before you start, you need an API key from a Google Cloud project with billing
enabled. The project needs the Maps JavaScript API and Places API (New)
enabled. If you restrict the key, add the website `http://localhost:8007` and
select those two APIs. To create and restrict a key, see
[Getting your API key](../../README.md#getting-your-api-key).

To view the app from a local dev server, first clone this library from GitHub,
then run the following command from the repository's root directory:

```bash
MAPS_API_KEY="[REPLACE_WITH_YOUR_API_KEY]" npm run example:localization_sample_app
```

Note that this command will build the library locally to incorporate its latest
changes, including those not yet released on NPM.
