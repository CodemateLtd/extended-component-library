/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement, ReactiveController, ReactiveControllerHost} from 'lit';

import {APILoader} from '../api_loader/api_loader.js';
import {RequestErrorEvent} from '../base/events.js';
import {ComputeRoutesRequest, ComputeRoutesResponse, RouteConstructor} from '../utils/googlemaps_types.js';
import {RequestCache} from '../utils/request_cache.js';
import {requestWithRetries} from '../utils/retry.js';
import {isAutoRetriableRpcError, isRetriableRpcError} from '../utils/rpc_status.js';

const CACHE_SIZE = 100;


function makeRoutesRequestCache() {
  return new RequestCache<
      ComputeRoutesRequest, ComputeRoutesResponse,
      google.maps.MapsRequestError>(CACHE_SIZE, isRetriableRpcError);
}

/**
 * Controller that interfaces with the Maps JavaScript Routes API.
 */
export class RoutesController implements ReactiveController {
  private static routeClass?: RouteConstructor;
  private static cache = makeRoutesRequestCache();

  constructor(private readonly host: ReactiveControllerHost&LitElement) {
    this.host.addController(this);
  }

  hostUpdate() {}

  /**
   * Makes a call to `Route.computeRoutes()` and returns the result as a
   * promise. A request that fails with a transient UNAVAILABLE or UNKNOWN
   * error is retried with a backoff, up to three attempts in total. If the
   * request still fails, the promise will resolve to null, and this method
   * will dispatch a `RequestErrorEvent` from the host element.
   */
  async computeRoutes(request: ComputeRoutesRequest):
      Promise<ComputeRoutesResponse|null> {
    let responsePromise = RoutesController.cache.get(request);
    if (responsePromise === null) {
      responsePromise = requestWithRetries(
          () => this.getRouteClass().then(
              (routeClass) => routeClass.computeRoutes(request)),
          isAutoRetriableRpcError);
      RoutesController.cache.set(request, responsePromise);
    }
    try {
      const awaited = await responsePromise;
      return awaited;
    } catch (error) {
      const requestErrorEvent = new RequestErrorEvent(error);
      this.host.dispatchEvent(requestErrorEvent);
      return null;
    }
  }

  private async getRouteClass(): Promise<RouteConstructor> {
    if (!RoutesController.routeClass) {
      const {Route} = await APILoader.importLibrary('routes', this.host) as
          typeof google.maps.routes;
      RoutesController.routeClass = Route;
    }
    return RoutesController.routeClass;
  }

  /**
   * Resets Routes Controller state by deleting any existing service object
   * and clearing its cache.
   * This method should be invoked for testing purposes only.
   * @ignore
   */
  static reset() {
    RoutesController.cache = makeRoutesRequestCache();
    RoutesController.routeClass = undefined;
  }
}
