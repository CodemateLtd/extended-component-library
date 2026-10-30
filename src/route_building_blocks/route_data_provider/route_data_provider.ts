/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {provide} from '@lit/context';
import {customElement, property} from 'lit/decorators.js';

import {BaseComponent} from '../../base/base_component.js';
import {RouteNotFoundEvent} from '../../base/events.js';
import {LAT_LNG_LITERAL_ATTRIBUTE_CONVERTER} from '../../utils/attribute_converters.js';
import type {ComputeRoutesResponse, DirectionsRoute, LatLng, LatLngLiteral, Route} from '../../utils/googlemaps_types.js';
import {routeContext} from '../route_data_consumer.js';
import {RoutesController} from '../routes_controller.js';

/**
 * Provides route data to child components as context.
 *
 * This component can fetch route data from the Routes API, or forward a
 * `Route` or `DirectionsRoute` object provided from elsewhere in code. The
 * component will locally cache route data to avoid redundant API requests.
 *
 * @slot - Elements to receive route data.
 *
 * @event {RequestErrorEvent} gmpx-requesterror - Indicates an error condition
 * in an underlying Google Maps JavaScript API call. (React: onRequestError)
 * @event {RouteNotFoundEvent} gmpx-routenotfound - Indicates that the Routes
 * API found no route, for example because an address could not be geocoded.
 * The event's `geocodingResults` property holds the geocoding status of each
 * address, or `null` if there is none. (React: onRouteNotFound)
 */
@customElement('gmpx-route-data-provider')
export class RouteDataProvider extends BaseComponent {
  /**
   * @ignore
   * Route data passed to child `RouteDataConsumer`s via context.
   */
  @provide({context: routeContext})
  @property({
    attribute: false,
    // The contextRoute property is only set by the component itself during its
    // update cycle. Don't trigger a second update when this happens.
    hasChanged: () => false,
  })
  contextRoute: Route|DirectionsRoute|undefined;

  /**
   * The destination of the directions request as a lat/lng. When setting the
   * destination, only one of lat/lng, Place ID, or address should be specified.
   */
  @property({
    converter: LAT_LNG_LITERAL_ATTRIBUTE_CONVERTER,
    attribute: 'destination-lat-lng',
    reflect: true
  })
  destinationLatLng?: LatLng|LatLngLiteral;

  /**
   * The destination of the directions request as a Place ID. When setting the
   * destination, only one of lat/lng, Place ID, or address should be specified.
   */
  @property({type: String, attribute: 'destination-place-id', reflect: true})
  destinationPlaceId?: string;

  /**
   * The destination of the directions request as an address query. When setting
   * the destination, only one of lat/lng, Place ID, or address should be
   * specified.
   */
  @property({type: String, attribute: 'destination-address', reflect: true})
  destinationAddress?: string;

  /**
   * The origin of the directions request as a lat/lng. When setting the origin,
   * only one of lat/lng, Place ID, or address should be specified.
   */
  @property({
    converter: LAT_LNG_LITERAL_ATTRIBUTE_CONVERTER,
    attribute: 'origin-lat-lng',
    reflect: true
  })
  originLatLng?: LatLng|LatLngLiteral;

  /**
   * The origin of the directions request as a Place ID. When setting the
   * origin, only one of lat/lng, Place ID, or address should be specified.
   */
  @property({type: String, attribute: 'origin-place-id', reflect: true})
  originPlaceId?: string;

  /**
   * The origin of the directions request as an address query. When setting the
   * origin, only one of lat/lng, Place ID, or address should be specified.
   */
  @property({type: String, attribute: 'origin-address', reflect: true})
  originAddress?: string;

  /**
   * Route data to be provided to consumers directly, instead of making an API
   * call.
   */
  @property({attribute: false}) route?: Route|DirectionsRoute;

  /**
   * The travel mode of the directions request.
   */
  @property({type: String, attribute: 'travel-mode', reflect: true})
  travelMode: Lowercase<google.maps.TravelMode> = 'driving';

  private readonly routesController = new RoutesController(this);
  private routeUpdateId = 0;

  protected override updated() {
    this.updateContextRoute();
  }

  private async updateContextRoute() {
    // Each update makes the result of any pending request outdated.
    const updateId = ++this.routeUpdateId;
    const isCurrent = () => updateId === this.routeUpdateId;

    if (this.route) {
      this.contextRoute = this.route;
      return;
    }

    const numOrigins =
        numTruthy(this.originAddress, this.originPlaceId, this.originLatLng);
    const numDestinations = numTruthy(
        this.destinationAddress, this.destinationPlaceId,
        this.destinationLatLng);

    if (numOrigins === 1 && numDestinations === 1) {
      const response = await this.fetchRoutes(isCurrent);
      if (!isCurrent()) return;
      this.contextRoute = response?.routes?.[0];
      if (response && !response.routes?.length) {
        const routeNotFoundEvent =
            new RouteNotFoundEvent(response.geocodingResults ?? null);
        this.dispatchEvent(routeNotFoundEvent);
      }
    } else {
      if (numOrigins > 1 && numDestinations !== 0) {
        this.logger.error(
            'Too many origins. Only one of origin-lat-lng, ' +
            'origin-place-id, or origin-address may be specified.');
      }
      if (numDestinations > 1 && numOrigins !== 0) {
        this.logger.error(
            'Too many destinations. Only one of destination-lat-lng, ' +
            'destination-place-id, or destination-address may be specified.');
      }
      this.contextRoute = undefined;
    }
  }

  private async fetchRoutes(isCurrent: () => boolean):
      Promise<ComputeRoutesResponse|null> {
    // If the request fails, routesController.computeRoutes() will return null,
    // and dispatch a RequestErrorEvent if the request is still current.
    return this.routesController.computeRoutes(
        {
          origin: this.getOriginRequestObject(),
          destination: this.getDestinationRequestObject(),
          fields: ['legs', 'path', 'viewport'],
          travelMode: this.travelMode?.toUpperCase() as google.maps.TravelMode,
          polylineQuality: 'HIGH_QUALITY',
        },
        isCurrent);
  }

  private getOriginRequestObject(): LatLng|LatLngLiteral|string {
    if (this.originLatLng) {
      return this.originLatLng;
    } else if (this.originPlaceId) {
      return `places/${this.originPlaceId}`
    } else {
      return this.originAddress ?? '';
    }
  }

  private getDestinationRequestObject(): LatLng|LatLngLiteral|string {
    if (this.destinationLatLng) {
      return this.destinationLatLng;
    } else if (this.destinationPlaceId) {
      return `places/${this.destinationPlaceId}`;
    } else {
      return this.destinationAddress ?? '';
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gmpx-route-data-provider': RouteDataProvider;
  }
}

/**
 * Counts and returns the number of arguments that are truthy.
 */
function numTruthy(...args: unknown[]): number {
  return args.filter((x) => x).length;
}
