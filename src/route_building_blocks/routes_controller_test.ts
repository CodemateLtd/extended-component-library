/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)

import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

import {Environment} from '../testing/environment.js';
import {makeFakeRoute} from '../testing/fake_route.js';
import {flushMicrotasks, settleRetries} from '../testing/mock_clock.js';
import type {ComputeRoutesRequest, ComputeRoutesResponse} from '../utils/googlemaps_types.js';

import {RoutesController} from './routes_controller.js';

interface RoutesError extends Omit<google.maps.MapsRequestError, 'endpoint'> {
  code: google.maps.RPCStatusString;
  // ROUTES_COMPUTE_ROUTES is not currently declared as part of the
  // MapsNetworkErrorEndpoint enum, so we need to override it.
  endpoint: 'ROUTES_COMPUTE_ROUTES';
}

const FAKE_REQUEST: ComputeRoutesRequest = {
  origin: {lat: 37.77, lng: -122.447},
  destination: {lat: 37.768, lng: -122.511},
  fields: ['legs', 'path', 'viewport'],
  travelMode: 'DRIVING',
};

const UNAVAILABLE_ERROR: RoutesError = {
  code: 'UNAVAILABLE',
  endpoint: 'ROUTES_COMPUTE_ROUTES',
  name: 'MapsRequestError',
  message: 'The Routes API is temporarily unavailable.',
};

@customElement('gmpx-test-routes-controller-host')
class TestRoutesControllerHost extends LitElement {
  routesController = new RoutesController(this);
}

describe('RoutesController', () => {
  const env = new Environment();

  async function prepareControllerHostElement() {
    const root = env.render(html`
      <gmpx-test-routes-controller-host>
      </gmpx-test-routes-controller-host>
    `);

    const host = root.querySelector<TestRoutesControllerHost>(
        'gmpx-test-routes-controller-host')!;
    if (!host) {
      throw new Error('Failed to find gmpx-test-routes-controller-host.');
    }
    await env.waitForStability();
    return host;
  }

  afterEach(() => {
    RoutesController.reset();
  });

  /**
   * `attemptsPerCall` is the number of service calls one caller call makes:
   * three (the bounded automatic retries) for the statuses that are safe to
   * retry, and one for RESOURCE_EXHAUSTED, which is never retried
   * automatically since that could multiply the quota usage that made the
   * request fail.
   */
  const parameters: Array<{error: RoutesError, attemptsPerCall: number}> = [
    {
      error: {
        code: 'UNKNOWN',
        endpoint: 'ROUTES_COMPUTE_ROUTES',
        name: 'MapsRequestError',
        message:
            'A Routes request could not be processed due to a server error.',
      },
      attemptsPerCall: 3,
    },
    {
      error: {
        code: 'RESOURCE_EXHAUSTED',
        endpoint: 'ROUTES_COMPUTE_ROUTES',
        name: 'MapsRequestError',
        message: 'The webpage is not allowed to use the Routes API.',
      },
      attemptsPerCall: 1,
    },
    {
      error: UNAVAILABLE_ERROR,
      attemptsPerCall: 3,
    }
  ];

  for (const {error, attemptsPerCall} of parameters) {
    it(`retries failed request due to transient error: ${error.code}`,
       async () => {
         const host = await prepareControllerHostElement();

         const routesSpy = spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler')
                               .and.rejectWith(error);
         const firstCall = host.routesController.computeRoutes(FAKE_REQUEST);
         await settleRetries();
         await firstCall;
         const secondCall = host.routesController.computeRoutes(FAKE_REQUEST);
         await settleRetries();
         await secondCall;

         await env.waitForStability();
         expect(routesSpy).toHaveBeenCalledTimes(attemptsPerCall * 2);
       });
  }

  it('recovers from a transient failure without a second caller call',
     async () => {
       const host = await prepareControllerHostElement();
       const errorListener = jasmine.createSpy('requestError');
       host.addEventListener('gmpx-requesterror', errorListener);
       const fakeResponse = {routes: [makeFakeRoute()]} as unknown as
           ComputeRoutesResponse;
       const routesSpy =
           spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler')
               .and.callFake(
                   () => routesSpy.calls.count() === 1 ?
                       Promise.reject(UNAVAILABLE_ERROR) :
                       Promise.resolve(fakeResponse));

       const responsePromise =
           host.routesController.computeRoutes(FAKE_REQUEST);
       await settleRetries();
       const response = await responsePromise;

       expect(routesSpy).toHaveBeenCalledTimes(2);
       expect(response).toBe(fakeResponse);
       expect(errorListener).not.toHaveBeenCalled();
     });

  it('waits for a randomized backoff delay before each retry, and ' +
         'dispatches one error event once the attempts run out',
     async () => {
       const host = await prepareControllerHostElement();
       const errorListener = jasmine.createSpy('requestError');
       host.addEventListener('gmpx-requesterror', errorListener);
       // With full jitter, the delay before retry N is a random fraction of
       // 100ms * 2^(N-1); fix the fraction at 0.5 for 50ms and 100ms delays.
       spyOn(Math, 'random').and.returnValue(0.5);
       const routesSpy =
           spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler')
               .and.rejectWith(UNAVAILABLE_ERROR);

       const responsePromise =
           host.routesController.computeRoutes(FAKE_REQUEST);
       await flushMicrotasks();
       expect(routesSpy).toHaveBeenCalledTimes(1);

       jasmine.clock().tick(49);
       await flushMicrotasks();
       expect(routesSpy).toHaveBeenCalledTimes(1);
       jasmine.clock().tick(1);
       await flushMicrotasks();
       expect(routesSpy).toHaveBeenCalledTimes(2);

       jasmine.clock().tick(99);
       await flushMicrotasks();
       expect(routesSpy).toHaveBeenCalledTimes(2);
       expect(errorListener).not.toHaveBeenCalled();
       jasmine.clock().tick(1);
       await flushMicrotasks();
       expect(routesSpy).toHaveBeenCalledTimes(3);

       expect(await responsePromise).toBeNull();
       expect(errorListener).toHaveBeenCalledTimes(1);
     });

  it('shares retry attempts between simultaneous callers', async () => {
    const host = await prepareControllerHostElement();
    const fakeResponse = {routes: [makeFakeRoute()]} as unknown as
        ComputeRoutesResponse;
    const routesSpy = spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler')
                          .and.callFake(
                              () => routesSpy.calls.count() === 1 ?
                                  Promise.reject(UNAVAILABLE_ERROR) :
                                  Promise.resolve(fakeResponse));

    const firstCall = host.routesController.computeRoutes(FAKE_REQUEST);
    const secondCall = host.routesController.computeRoutes(FAKE_REQUEST);
    await settleRetries();

    expect(routesSpy).toHaveBeenCalledTimes(2);
    expect(await firstCall).toBe(fakeResponse);
    expect(await secondCall).toBe(fakeResponse);
  });

  it('does not retry failed request due to non transient error', async () => {
    const host = await prepareControllerHostElement();

    const error: RoutesError = {
      code: 'INVALID_ARGUMENT',
      endpoint: 'ROUTES_COMPUTE_ROUTES',
      name: 'MapsRequestError',
      message: 'The webpage is not allowed to use the directions service'
    };

    const routesSpy =
        spyOn(env.fakeGoogleMapsHarness!, 'computeRoutesHandler').and.rejectWith(error);
    await host.routesController.computeRoutes(FAKE_REQUEST);
    await host.routesController.computeRoutes(FAKE_REQUEST);

    await env.waitForStability();
    expect(routesSpy).toHaveBeenCalledTimes(1);
  });
});
