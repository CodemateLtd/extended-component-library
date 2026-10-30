/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)
import './route_data_provider.js';

import {consume} from '@lit/context';
import {html, LitElement, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {RouteNotFoundEvent} from '../../base/events.js';
import {LoggingController} from '../../base/logging_controller.js';
import {Environment} from '../../testing/environment.js';
import {Deferred} from '../../utils/deferred.js';
import type {ComputeRoutesRequest, ComputeRoutesResponse, GeocodingResults, Route} from '../../utils/googlemaps_types.js';
import {routeContext} from '../route_data_consumer.js';
import {RoutesController} from '../routes_controller.js';

import {RouteDataProvider} from './route_data_provider.js';

const FAKE_ROUTE = {} as Route;
const FAKE_COMPUTE_ROUTES_RESPONSE = {
  routes: [FAKE_ROUTE]
} as ComputeRoutesResponse;

@customElement('gmpx-fake-route-data-consumer')
class FakeRouteDataConsumer extends LitElement {
  @consume({context: routeContext, subscribe: true})
  @property({attribute: false})
  contextRoute: Route|google.maps.DirectionsRoute|undefined;
}

describe('RouteDataProvider', () => {
  const env = new Environment();

  async function prepareState(template?: TemplateResult) {
    const routeSpy = spyOn(RoutesController.prototype, 'computeRoutes')
                         .and.resolveTo(FAKE_COMPUTE_ROUTES_RESPONSE);
    const errorSpy = spyOn(LoggingController.prototype, 'error');
    const root = env.render(
        template ??
        html`<gmpx-route-data-provider></gmpx-route-data-provider>`);
    await env.waitForStability();
    const provider =
        root.querySelector<RouteDataProvider>('gmpx-route-data-provider')!;

    return {root, provider, routeSpy, errorSpy};
  }

  it('is defined', () => {
    const provider = document.createElement('gmpx-route-data-provider');
    expect(provider).toBeInstanceOf(RouteDataProvider);
  });

  it('fetches a route with lat-lng attributes', async () => {
    const {provider, routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-lat-lng="1,2" destination-lat-lng="3,4">
      </gmpx-route-data-provider>`);

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual({lat: 1, lng: 2});
    expect(arg.destination).toEqual({lat: 3, lng: 4});
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('fetches a route with latLng properties', async () => {
    const {provider, routeSpy} = await prepareState();

    provider.originLatLng = {lat: 5, lng: 6};
    provider.destinationLatLng = {lat: 7, lng: 8};
    await env.waitForStability();

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual({lat: 5, lng: 6});
    expect(arg.destination).toEqual({lat: 7, lng: 8});
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('fetches a route with place-id attributes', async () => {
    const {provider, routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-place-id="abc" destination-place-id="123">
      </gmpx-route-data-provider>`);

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual('places/abc');
    expect(arg.destination).toEqual('places/123');
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('fetches a route with placeId properties', async () => {
    const {provider, routeSpy} = await prepareState();

    provider.originPlaceId = 'def';
    provider.destinationPlaceId = '456';
    await env.waitForStability();

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual('places/def');
    expect(arg.destination).toEqual('places/456');
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('fetches a route with address attributes', async () => {
    const {provider, routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123">
      </gmpx-route-data-provider>`);

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual('abc');
    expect(arg.destination).toEqual('123');
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('fetches a route with address properties', async () => {
    const {provider, routeSpy} = await prepareState();

    provider.originAddress = 'def';
    provider.destinationAddress = '456';
    await env.waitForStability();

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.origin).toEqual('def');
    expect(arg.destination).toEqual('456');
    expect(provider.contextRoute).toBe(FAKE_ROUTE);
  });

  it('does nothing if only origin is provided', async () => {
    const {provider, routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc">
      </gmpx-route-data-provider>`);

    expect(routeSpy).not.toHaveBeenCalled();
    expect(provider.contextRoute).toBe(undefined);
  });

  it('does nothing if only destination is provided', async () => {
    const {provider, routeSpy} = await prepareState(html`
      <gmpx-route-data-provider destination-address="abc">
      </gmpx-route-data-provider>`);

    expect(routeSpy).not.toHaveBeenCalled();
    expect(provider.contextRoute).toBe(undefined);
  });

  it('logs an error on multiple origins', async () => {
    const {provider, routeSpy, errorSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" origin-place-id="def"
          destination-address="123">
      </gmpx-route-data-provider>`);

    expect(routeSpy).not.toHaveBeenCalled();
    expect(provider.contextRoute).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledOnceWith(
        'Too many origins. Only one of origin-lat-lng, ' +
        'origin-place-id, or origin-address may be specified.');
  });

  it('logs an error on multiple destinations', async () => {
    const {provider, routeSpy, errorSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123"
          destination-place-id="123">
      </gmpx-route-data-provider>`);

    expect(routeSpy).not.toHaveBeenCalled();
    expect(provider.contextRoute).toBe(undefined);
    expect(errorSpy).toHaveBeenCalledOnceWith(
        'Too many destinations. Only one of destination-lat-lng, ' +
        'destination-place-id, or destination-address may be specified.');
  });

  it('defaults the travel mode to driving', async () => {
    const {routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123">
      </gmpx-route-data-provider>`);

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.travelMode).toEqual('DRIVING');
  });

  it('sets the travel mode via attribute', async () => {
    const {routeSpy} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123"
          travel-mode="walking">
      </gmpx-route-data-provider>`);

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.travelMode).toEqual('WALKING');
  });

  it('sets the travel mode via property', async () => {
    const {provider, routeSpy} = await prepareState();

    provider.originAddress = 'abc';
    provider.destinationAddress = '123';
    provider.travelMode = 'transit';
    await env.waitForStability();

    expect(routeSpy).toHaveBeenCalledTimes(1);
    const arg = routeSpy.calls.mostRecent().args[0];
    expect(arg.travelMode).toEqual('TRANSIT');
  });

  it('provides a route via the route property', async () => {
    const {root, provider} = await prepareState(html`
      <gmpx-route-data-provider>
        <gmpx-fake-route-data-consumer></gmpx-fake-route-data-consumer>
      </gmpx-route-data-provider>`);
    const consumer = root.querySelector<FakeRouteDataConsumer>(
        'gmpx-fake-route-data-consumer')!;

    provider.route = FAKE_ROUTE;
    await env.waitForStability();

    expect(consumer.contextRoute).toBe(FAKE_ROUTE);
  });

  it('provides a route via API call', async () => {
    const {root} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123">
        <gmpx-fake-route-data-consumer></gmpx-fake-route-data-consumer>
      </gmpx-route-data-provider>`);
    const consumer = root.querySelector<FakeRouteDataConsumer>(
        'gmpx-fake-route-data-consumer')!;

    expect(consumer.contextRoute).toBe(FAKE_ROUTE);
  });

  it('prioritizes the route from the route property', async () => {
    const {root, provider} = await prepareState(html`
      <gmpx-route-data-provider origin-address="abc" destination-address="123">
        <gmpx-fake-route-data-consumer></gmpx-fake-route-data-consumer>
      </gmpx-route-data-provider>`);
    const consumer = root.querySelector<FakeRouteDataConsumer>(
        'gmpx-fake-route-data-consumer')!;

    const route = {} as google.maps.DirectionsRoute;
    provider.route = route;
    await env.waitForStability();

    expect(consumer.contextRoute).toBe(route);
  });

  it('updates the route when set to something new', async () => {
    const {root, provider} = await prepareState(html`
      <gmpx-route-data-provider>
        <gmpx-fake-route-data-consumer></gmpx-fake-route-data-consumer>
      </gmpx-route-data-provider>`);
    const consumer = root.querySelector<FakeRouteDataConsumer>(
        'gmpx-fake-route-data-consumer')!;

    provider.route = FAKE_ROUTE;
    await env.waitForStability();
    const route = {} as google.maps.DirectionsRoute;
    provider.route = route;
    await env.waitForStability();

    expect(consumer.contextRoute).toBe(route);
  });

  describe('with requests that finish out of order', () => {
    let pendingResponses: Map<string, Deferred<ComputeRoutesResponse>>;

    beforeEach(() => {
      RoutesController.reset();
      pendingResponses = new Map();
      env.fakeGoogleMapsHarness!.computeRoutesHandler =
          (request: ComputeRoutesRequest) => {
            const deferred = new Deferred<ComputeRoutesResponse>();
            pendingResponses.set(request.origin as string, deferred);
            return deferred.promise;
          };
    });

    afterEach(() => {
      RoutesController.reset();
    });

    function makeError() {
      return Object.assign(new Error('Invalid route'), {
        code: 'INVALID_ARGUMENT',
        endpoint: 'ROUTES_COMPUTE_ROUTES',
        name: 'MapsRequestError',
      });
    }

    function makeResponse(route: Route) {
      return {routes: [route]} as ComputeRoutesResponse;
    }

    async function settle() {
      // A response passes through several awaits before it reaches
      // contextRoute, so wait for more than one round of updates.
      for (let i = 0; i < 5; i++) {
        await env.waitForStability();
        await Promise.resolve();
      }
    }

    async function renderProvider(originAddress: string) {
      const root = env.render(html`
        <gmpx-route-data-provider origin-address=${originAddress}
            destination-address="Z">
        </gmpx-route-data-provider>`);
      await settle();
      const provider =
          root.querySelector<RouteDataProvider>('gmpx-route-data-provider')!;
      const errorListener = jasmine.createSpy('requestError');
      provider.addEventListener('gmpx-requesterror', errorListener);
      return {provider, errorListener};
    }

    it('ignores an older error after a newer route arrives', async () => {
      const {provider, errorListener} = await renderProvider('A');
      provider.originAddress = 'B';
      await settle();
      const newRoute = {} as Route;
      pendingResponses.get('B')!.resolve(makeResponse(newRoute));
      await settle();

      pendingResponses.get('A')!.reject(makeError());
      await settle();

      expect(errorListener).not.toHaveBeenCalled();
      expect(provider.contextRoute).toBe(newRoute);
    });

    it('ignores an older route after a newer route arrives', async () => {
      const {provider} = await renderProvider('A');
      provider.originAddress = 'B';
      await settle();
      const newRoute = {} as Route;
      pendingResponses.get('B')!.resolve(makeResponse(newRoute));
      await settle();

      pendingResponses.get('A')!.resolve(makeResponse({} as Route));
      await settle();

      expect(provider.contextRoute).toBe(newRoute);
    });

    it('ignores an older empty result after a newer route arrives',
       async () => {
         const {provider} = await renderProvider('A');
         const notFoundListener = jasmine.createSpy('routeNotFound');
         provider.addEventListener('gmpx-routenotfound', notFoundListener);
         provider.originAddress = 'B';
         await settle();
         const newRoute = {} as Route;
         pendingResponses.get('B')!.resolve(makeResponse(newRoute));
         await settle();

         pendingResponses.get('A')!.resolve(
             {routes: []} as unknown as ComputeRoutesResponse);
         await settle();

         expect(notFoundListener).not.toHaveBeenCalled();
         expect(provider.contextRoute).toBe(newRoute);
       });

    it('ignores an older route after a newer request fails', async () => {
      const {provider, errorListener} = await renderProvider('A');
      provider.originAddress = 'B';
      await settle();
      pendingResponses.get('B')!.reject(makeError());
      await settle();

      pendingResponses.get('A')!.resolve(makeResponse({} as Route));
      await settle();

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(provider.contextRoute).toBeUndefined();
    });

    it('keeps the route property over a pending request', async () => {
      const {provider} = await renderProvider('A');
      const route = {} as Route;
      provider.route = route;
      await settle();

      pendingResponses.get('A')!.resolve(makeResponse({} as Route));
      await settle();

      expect(provider.contextRoute).toBe(route);
    });

    it('ignores a pending request after the origin is cleared', async () => {
      const {provider} = await renderProvider('A');
      provider.originAddress = undefined;
      await settle();

      pendingResponses.get('A')!.resolve(makeResponse({} as Route));
      await settle();

      expect(provider.contextRoute).toBeUndefined();
    });

    it('reports one error when an update repeats a pending request',
       async () => {
         const {provider, errorListener} = await renderProvider('A');
         const handlerSpy =
             spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler')
                 .and.callThrough();
         provider.requestUpdate();
         await settle();
         expect(handlerSpy).not.toHaveBeenCalled();

         pendingResponses.get('A')!.reject(makeError());
         await settle();

         expect(errorListener).toHaveBeenCalledTimes(1);
       });
  });

  describe('when no route is found', () => {
    beforeEach(() => {
      RoutesController.reset();
    });

    afterEach(() => {
      RoutesController.reset();
    });

    async function renderProvider(
        computeRoutes: () => Promise<ComputeRoutesResponse>) {
      env.fakeGoogleMapsHarness!.computeRoutesHandler = computeRoutes;
      const notFoundListener = jasmine.createSpy('routeNotFound');
      const errorListener = jasmine.createSpy('requestError');
      const root = env.render(html`
        <gmpx-route-data-provider origin-address="A" destination-address="Z"
            @gmpx-routenotfound=${notFoundListener}
            @gmpx-requesterror=${errorListener}>
        </gmpx-route-data-provider>`);
      // A response passes through several awaits before it is reported.
      for (let i = 0; i < 5; i++) {
        await env.waitForStability();
        await Promise.resolve();
      }
      const provider =
          root.querySelector<RouteDataProvider>('gmpx-route-data-provider')!;
      return {provider, notFoundListener, errorListener};
    }

    it('dispatches an event with the geocoding results', async () => {
      const geocodingResults = {
        origin: {geocoderStatus: 'NOT_FOUND'},
        destination: {geocoderStatus: 'OK'},
      } as unknown as GeocodingResults;
      const {provider, notFoundListener, errorListener} =
          await renderProvider(() => Promise.resolve({
            routes: [],
            geocodingResults,
          } as unknown as ComputeRoutesResponse));

      expect(notFoundListener).toHaveBeenCalledTimes(1);
      const event = notFoundListener.calls.mostRecent().args[0];
      expect(event).toBeInstanceOf(RouteNotFoundEvent);
      expect(event.geocodingResults).toBe(geocodingResults);
      expect(errorListener).not.toHaveBeenCalled();
      expect(provider.contextRoute).toBeUndefined();
    });

    it('dispatches an event without geocoding results', async () => {
      const {notFoundListener} = await renderProvider(
          () => Promise.resolve(
              {routes: []} as unknown as ComputeRoutesResponse));

      expect(notFoundListener).toHaveBeenCalledTimes(1);
      const event = notFoundListener.calls.mostRecent().args[0];
      expect(event.geocodingResults).toBeNull();
    });

    it('dispatches nothing when a route is found', async () => {
      const {provider, notFoundListener} = await renderProvider(
          () => Promise.resolve(FAKE_COMPUTE_ROUTES_RESPONSE));

      expect(notFoundListener).not.toHaveBeenCalled();
      expect(provider.contextRoute).toBe(FAKE_ROUTE);
    });

    it('dispatches only a request error when the request fails', async () => {
      const {notFoundListener, errorListener} = await renderProvider(
          () => Promise.reject(new Error('Request failed')));

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(notFoundListener).not.toHaveBeenCalled();
    });
  });
});
