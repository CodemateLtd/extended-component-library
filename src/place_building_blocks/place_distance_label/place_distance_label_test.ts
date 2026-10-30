/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)

import {html} from 'lit';

import {RoutesController} from '../../route_building_blocks/routes_controller.js';
import {Environment} from '../../testing/environment.js';
import {FakeLatLng} from '../../testing/fake_lat_lng.js';
import {makeFakePlace} from '../../testing/fake_place.js';
import {Deferred} from '../../utils/deferred.js';
import type {ComputeRoutesRequest, ComputeRoutesResponse, LatLng, LatLngLiteral, Place} from '../../utils/googlemaps_types.js';

import {PlaceDistanceLabel} from './place_distance_label.js';

type TravelMode = google.maps.TravelMode;

const FAKE_ORIGIN_LAT_LNG = new FakeLatLng(-1.23, 1.23);
const FAKE_ORIGIN_LAT_LNG_LITERAL = {
  lat: -1.23,
  lng: 1.23,
};
const FAKE_PLACE = makeFakePlace({
  id: 'FAKE_PLACE_ID',
  location: new FakeLatLng(-4.56, 4.56),
});
const FAKE_COMPUTE_ROUTES_RESPONSE = {
  routes: [{
    legs: [{
      localizedValues: {
        distance: '1.5 mi',
        duration: '15 mins',
      },
    }],
  }],
} as unknown as ComputeRoutesResponse;

describe('PlaceDistanceLabel', () => {
  const env = new Environment();

  async function prepareState(config?: {
    place?: Place|null,
    origin?: LatLng|LatLngLiteral|Place,
    travelMode?: Lowercase<TravelMode>,
  }): Promise<{label: PlaceDistanceLabel; routeSpy: jasmine.Spy}> {
    const routeSpy = spyOn(RoutesController.prototype, 'computeRoutes')
                         .and.resolveTo(FAKE_COMPUTE_ROUTES_RESPONSE);
    const root = env.render(html`
      <gmpx-place-distance-label-internal
        .place=${config?.place}
        .origin=${config?.origin}
        .travelMode=${config?.travelMode}
      ></gmpx-place-distance-label-internal>
    `);
    await env.waitForStability();
    const label = root.querySelector<PlaceDistanceLabel>(
        'gmpx-place-distance-label-internal')!;
    return {label, routeSpy};
  }

  it('is defined', () => {
    const el = document.createElement('gmpx-place-distance-label-internal');
    expect(el).toBeInstanceOf(PlaceDistanceLabel);
  });

  it('renders nothing when Place data is not provided', async () => {
    const {label, routeSpy} =
        await prepareState({place: null, origin: FAKE_ORIGIN_LAT_LNG});

    expect(routeSpy).not.toHaveBeenCalled();
    expect(label.renderRoot.textContent).toBe('');
    expect(label.noData).toBeTrue();
  });

  it('renders nothing when travel origin is not provided', async () => {
    const {label, routeSpy} =
        await prepareState({place: FAKE_PLACE, origin: undefined});

    expect(routeSpy).not.toHaveBeenCalled();
    expect(label.renderRoot.textContent).toBe('');
    expect(label.noData).toBeTrue();
  });

  it('renders distance with origin specified by LatLng', async () => {
    const {label, routeSpy} =
        await prepareState({place: FAKE_PLACE, origin: FAKE_ORIGIN_LAT_LNG});

    expect(routeSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          origin: FAKE_ORIGIN_LAT_LNG,
          destination: jasmine.objectContaining({id: 'FAKE_PLACE_ID'}),
        }),
        jasmine.any(Function));
    expect(label.renderRoot.textContent).toBe('1.5 mi');
    expect(label.noData).toBeFalse();
  });

  it('renders distance with origin specified by LatLngLiteral', async () => {
    const {label, routeSpy} = await prepareState(
        {place: FAKE_PLACE, origin: FAKE_ORIGIN_LAT_LNG_LITERAL});

    expect(routeSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          origin: FAKE_ORIGIN_LAT_LNG_LITERAL,
          destination: jasmine.objectContaining({id: 'FAKE_PLACE_ID'}),
        }),
        jasmine.any(Function));
    expect(label.renderRoot.textContent).toBe('1.5 mi');
    expect(label.noData).toBeFalse();
  });

  it('renders distance with origin specified by Place object', async () => {
    const {label, routeSpy} = await prepareState(
        {place: FAKE_PLACE, origin: makeFakePlace({id: 'ORIGIN_ID'})});

    expect(routeSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          origin: jasmine.objectContaining({id: 'ORIGIN_ID'}),
          destination: jasmine.objectContaining({id: 'FAKE_PLACE_ID'}),
        }),
        jasmine.any(Function));
    expect(label.renderRoot.textContent).toBe('1.5 mi');
    expect(label.noData).toBeFalse();
  });

  const travelModeParams: Array<{
    attrValue: Lowercase<TravelMode>,
    enumValue: string,
    iconName: string,
  }> =
      [
        {
          attrValue: 'bicycling',
          enumValue: 'BICYCLING',
          iconName: 'directions_bike',
        },
        {
          attrValue: 'driving',
          enumValue: 'DRIVING',
          iconName: 'directions_car',
        },
        {
          attrValue: 'transit',
          enumValue: 'TRANSIT',
          iconName: 'directions_subway',
        },
        {
          attrValue: 'walking',
          enumValue: 'WALKING',
          iconName: 'directions_walk',
        }
      ];
  travelModeParams.forEach(({attrValue, enumValue, iconName}) => {
    it(`renders duration & icon when travel mode is ${attrValue}`, async () => {
      const {label, routeSpy} = await prepareState({
        place: FAKE_PLACE,
        origin: FAKE_ORIGIN_LAT_LNG,
        travelMode: attrValue,
      });

      expect(routeSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            origin: FAKE_ORIGIN_LAT_LNG,
            destination: jasmine.objectContaining({id: 'FAKE_PLACE_ID'}),
            travelMode: enumValue as TravelMode,
          }),
          jasmine.any(Function));
      expect(label.renderRoot.textContent).toContain('15 mins');
      const icon = label.renderRoot.querySelector<HTMLSpanElement>('.icon');
      expect(icon?.textContent).toHaveNormalizedText(iconName);
      expect(label.noData).toBeFalse();
    });
  });

  it(`updates on new travel mode and same directions data`, async () => {
    const {label} = await prepareState({
      place: FAKE_PLACE,
      origin: FAKE_ORIGIN_LAT_LNG,
    });

    label.travelMode = 'driving';
    await env.waitForStability();

    expect(label.renderRoot.textContent).toContain('15 mins');
  });

  it(`doesn't make Routes request when Place ID is unchanged`, async () => {
    const {label, routeSpy} = await prepareState(
        {place: FAKE_PLACE, origin: FAKE_ORIGIN_LAT_LNG_LITERAL});

    label.place = makeFakePlace({id: 'FAKE_PLACE_ID', displayName: 'Foo Bar'});
    await env.waitForStability();

    expect(routeSpy).toHaveBeenCalledTimes(1);
  });

  describe('with inputs that change during a request', () => {
    let pendingResponses: Map<string, Deferred<ComputeRoutesResponse>>;

    beforeEach(() => {
      RoutesController.reset();
      pendingResponses = new Map();
      env.fakeGoogleMapsHarness!.computeRoutesHandler =
          (request: ComputeRoutesRequest) => {
            const origin = request.origin as LatLngLiteral;
            const destination = request.destination as Place;
            const key = `${origin.lat}/${request.travelMode}/${destination.id}`;
            const deferred = new Deferred<ComputeRoutesResponse>();
            pendingResponses.set(key, deferred);
            return deferred.promise;
          };
    });

    afterEach(() => {
      RoutesController.reset();
    });

    function makePlace(id: string) {
      // The request cache keys on the request's JSON, so the fake's JSON has
      // to tell places apart.
      return makeFakePlace({id, toJSON: () => ({id})});
    }

    function makeError() {
      return Object.assign(new Error('Invalid route'), {
        code: 'INVALID_ARGUMENT',
        endpoint: 'ROUTES_COMPUTE_ROUTES',
        name: 'MapsRequestError',
      });
    }

    function makeResponse(distance: string, duration: string) {
      return {
        routes: [{legs: [{localizedValues: {distance, duration}}]}],
      } as unknown as ComputeRoutesResponse;
    }

    async function settle() {
      // A response passes through several awaits before it is rendered, so
      // wait for more than one round of updates.
      for (let i = 0; i < 5; i++) {
        await env.waitForStability();
        await Promise.resolve();
      }
    }

    async function renderLabel(
        origin: LatLngLiteral, place: Place,
        travelMode?: Lowercase<TravelMode>) {
      const root = env.render(html`
        <gmpx-place-distance-label-internal
          .place=${place}
          .origin=${origin}
          .travelMode=${travelMode}
        ></gmpx-place-distance-label-internal>
      `);
      await settle();
      return root.querySelector<PlaceDistanceLabel>(
          'gmpx-place-distance-label-internal')!;
    }

    it('fetches an origin set during a request', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      label.origin = {lat: 2, lng: 0};
      await settle();
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();

      expect(label.renderRoot.textContent).toBe('2 km');
    });

    it('fetches a travel mode set during a request', async () => {
      const label =
          await renderLabel({lat: 1, lng: 0}, makePlace('P'), 'driving');
      label.travelMode = 'walking';
      await settle();
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      pendingResponses.get('1/WALKING/P')!.resolve(
          makeResponse('1 km', '12 mins'));
      await settle();

      expect(label.renderRoot.textContent).toContain('12 mins');
      const icon = label.renderRoot.querySelector<HTMLSpanElement>('.icon');
      expect(icon?.textContent).toHaveNormalizedText('directions_walk');
    });

    it('fetches a place set during a request', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P1'));
      label.place = makePlace('P2');
      await settle();
      pendingResponses.get('1/DRIVING/P1')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      pendingResponses.get('1/DRIVING/P2')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();

      expect(label.renderRoot.textContent).toBe('2 km');
    });

    it('renders nothing for an origin cleared during a request', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      label.origin = undefined;
      await settle();

      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      expect(label.renderRoot.textContent).toBe('');
      expect(label.noData).toBeTrue();
    });

    it('sets no-data in the update that clears the origin', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      label.origin = undefined;
      await env.waitForStability();

      expect(label.noData).toBeTrue();
      expect(label.hasAttribute('no-data')).toBeTrue();
    });

    it('sets no-data while a new request is pending', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();
      expect(label.noData).toBeFalse();

      label.origin = {lat: 2, lng: 0};
      await env.waitForStability();
      expect(label.noData).toBeTrue();

      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();
      expect(label.noData).toBeFalse();
      expect(label.renderRoot.textContent).toBe('2 km');
    });

    it('keeps no-data until the newest request returns', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();
      label.origin = {lat: 2, lng: 0};
      await settle();
      label.origin = {lat: 3, lng: 0};
      await settle();

      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();
      // Re-render without a new request.
      label.place = makePlace('P');
      await settle();
      expect(label.noData).toBeTrue();

      pendingResponses.get('3/DRIVING/P')!.resolve(
          makeResponse('3 km', '3 mins'));
      await settle();
      expect(label.noData).toBeFalse();
    });

    it('clears no-data when an older response arrives last', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      label.origin = {lat: 2, lng: 0};
      await settle();
      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();

      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();
      // Re-render without a new request.
      label.place = makePlace('P');
      await settle();

      expect(label.noData).toBeFalse();
    });

    it('ignores an older response that arrives after a newer one', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      label.origin = {lat: 2, lng: 0};
      await settle();
      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();

      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();

      expect(label.renderRoot.textContent).toBe('2 km');
    });

    it('renders nothing while the newest request is pending', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      pendingResponses.get('1/DRIVING/P')!.resolve(
          makeResponse('1 km', '1 min'));
      await settle();
      label.origin = {lat: 2, lng: 0};
      await settle();
      label.origin = {lat: 3, lng: 0};
      await settle();

      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();
      // Re-render without a new request.
      label.place = makePlace('P');
      await settle();

      expect(label.renderRoot.textContent).toBe('');
    });

    it('ignores an older request that fails', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      const errorListener = jasmine.createSpy('requestError');
      label.addEventListener('gmpx-requesterror', errorListener);
      label.origin = {lat: 2, lng: 0};
      await settle();
      pendingResponses.get('1/DRIVING/P')!.reject(makeError());
      await settle();

      pendingResponses.get('2/DRIVING/P')!.resolve(
          makeResponse('2 km', '2 mins'));
      await settle();

      expect(errorListener).not.toHaveBeenCalled();
      expect(label.renderRoot.textContent).toBe('2 km');
    });

    it('reports one error when the origin changes back', async () => {
      const label = await renderLabel({lat: 1, lng: 0}, makePlace('P'));
      const errorListener = jasmine.createSpy('requestError');
      label.addEventListener('gmpx-requesterror', errorListener);
      label.origin = {lat: 2, lng: 0};
      await settle();
      label.origin = {lat: 1, lng: 0};
      await settle();

      pendingResponses.get('1/DRIVING/P')!.reject(makeError());
      await settle();

      expect(errorListener).toHaveBeenCalledTimes(1);
    });
  });
});
