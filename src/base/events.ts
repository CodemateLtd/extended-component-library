/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {GeocodingResults} from '../utils/googlemaps_types.js';

// Placeholder for ExtensibleEvent (google3-only)

/**
 * Event emitted when error occurs in an underlying request to the Google Maps
 * API web service.
 *
 * @param error The `Error` object thrown by the Maps JavaScript API.
 */
export class RequestErrorEvent extends Event {
  constructor(readonly error: unknown) {
    super('gmpx-requesterror', {bubbles: false, composed: false});
  }
}

/**
 * Event emitted when a request to the Routes API succeeds but finds no route,
 * for example because an address could not be geocoded.
 *
 * @param geocodingResults The geocoding results from the response, or `null`
 *     if it has none.
 */
export class RouteNotFoundEvent extends Event {
  constructor(readonly geocodingResults: GeocodingResults|null) {
    super('gmpx-routenotfound', {bubbles: false, composed: false});
  }
}
