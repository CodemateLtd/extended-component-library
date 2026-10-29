# Store Locator Sample App

This directory contains a simple JS app that uses the
[Store Locator](../../src/store_locator/README.md) component to show a list of
US National Parks on a map. Users can search for their location to sort the
parks by distance, view details such as photos, hours and reviews, and get
directions to a park.

The app sets the component's `listings` and `mapOptions` properties in
`src/index.js`, and uses the `advanced` feature set.

Before you start, you need an API key from a Google Cloud project with billing
enabled. The project needs the Maps JavaScript API, Places API (New) and Routes
API enabled. If you restrict the key, add the website `http://localhost:8005`
and select those three APIs. To create and restrict a key, see
[Getting your API key](../../README.md#getting-your-api-key).

To view the app from a local dev server, first clone this library from GitHub,
then run the following command from the repository's root directory:

```sh
MAPS_API_KEY="[REPLACE_WITH_YOUR_API_KEY]" npm run example:store_locator_sample_app
```

Note that this command will build the library locally to incorporate its latest
changes, including those not yet released on NPM.

The map uses `DEMO_MAP_ID`, which is for testing only. In your own app, set
`map-id` to a [Map ID](https://developers.google.com/maps/documentation/get-map-id)
from your project.

If a distance or directions request fails, for example because the Routes API
isn't enabled, the store locator dispatches a `gmpx-requesterror` event. The app
shows a message at the top of the page and logs the error to the console.
Errors from the search box and the details view are not reported through this
event.
