# Route Sample App

This directory contains a JS app that shows a driving route between an
origin and a destination that the user types in. The same route is drawn twice:

- on the left by a Route Overview, `<gmpx-route-overview>`, with its default
  markers and outlined polyline
- on the right by the route building blocks, a `<gmpx-route-data-provider>`
  with a custom `<gmpx-route-polyline>` and `<gmpx-route-marker>` elements that
  render their own content

Both read the same route data, which the components cache, so each new pair of
addresses makes one Routes API request.

Before you start, you need an API key from a Google Cloud project with billing
enabled. The project needs the Maps JavaScript API and the Routes API enabled.
If you restrict the key, add the website `http://localhost:8004` and select
those two APIs. To create and restrict a key, see
[Getting your API key](../../README.md#getting-your-api-key).

To view the app from a local dev server, first clone this library from GitHub,
then run the following command from the repository's root directory:

```sh
MAPS_API_KEY="[REPLACE_WITH_YOUR_API_KEY]" npm run example:route_sample_app
```

Note that this command will build the library locally to incorporate its latest
changes, including those not yet released on NPM.

## Request errors

The app listens for `gmpx-requesterror` on both the Route Overview and the Route
Data Provider, and shows the error message above the maps. This event fires
when the Routes API request fails, for example when the key doesn't allow the
Routes API. To see it, type coordinates such as `48.85,2.35` as the origin: the
components send the origin as an address, and the Routes API rejects an address
that is a pair of coordinates.

An address the Routes API can't find, or two places with no route between them,
is not a request error. The request succeeds with no route, so the maps show no
route and no event fires. The app says so under the form.
