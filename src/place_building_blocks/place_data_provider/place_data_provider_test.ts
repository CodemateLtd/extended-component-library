/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)
import '../place_attribution/place_attribution.js';

import {html, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import {Environment} from '../../testing/environment.js';
import {makeFakePlace} from '../../testing/fake_place.js';
import {Deferred} from '../../utils/deferred.js';
import type {Place, PlaceResult} from '../../utils/googlemaps_types.js';
import {PlaceDataConsumer} from '../place_data_consumer.js';

import {PlaceDataProvider} from './place_data_provider.js';


@customElement('gmpx-test-consumer')
class TestConsumer extends PlaceDataConsumer {
  @property({type: String}) field?: 'displayName'|'rating';

  private updateCount = 0;

  protected override render() {
    return html`${JSON.stringify(this.getPlace())}`;
  }

  protected override updated() {
    this.updateCount++;
  }

  resetUpdateCount() {
    this.updateCount = 0;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  getRequiredFields(): Array<keyof Place> {
    return this.field ? [this.field] : [];
  }

  protected override placeHasData(place: Place): boolean {
    if (this.field === 'displayName') {
      return place.displayName != null;
    } else if (this.field === 'rating') {
      return place.rating != null;
    } else {
      return false;
    }
  }
}

describe('PlaceDataProvider', () => {
  const env = new Environment();

  function attachFetchFieldsSpy(place: Place, fetchFieldsSpy: jasmine.Spy) {
    fetchFieldsSpy.and.callFake(
        async ({fields}: google.maps.places.FetchFieldsRequest) => {
          if ([...fields].includes('displayName')) {
            // Properties of Place are getter-only in the typings
            Object.defineProperty(place, 'displayName', {
              get: () => 'Fake Place',
              configurable: true,
            });
          }
          if ([...fields].includes('rating')) {
            Object.defineProperty(place, 'rating', {
              get: () => 5,
              configurable: true,
            });
          }
          return {place};
        });
    place.fetchFields = fetchFieldsSpy;
  }

  async function prepareState(
      template: TemplateResult, fetchFields?: () => Promise<{place: Place}>):
      Promise<{provider: PlaceDataProvider, fetchFieldsSpy: jasmine.Spy}> {
    const fetchFieldsSpy = jasmine.createSpy('fetchFields');
    env.fakeGoogleMapsHarness!.placeConstructor = (options) => {
      const place = makeFakePlace({
        id: options.id,
        fetchFields,
      });
      if (!fetchFields) {
        attachFetchFieldsSpy(place, fetchFieldsSpy);
      }
      return place;
    };

    const root = env.render(template);
    await env.waitForStability();
    return {
      provider: root.querySelector('gmpx-place-data-provider')!,
      fetchFieldsSpy,
    };
  }

  it('is defined', () => {
    const el = document.createElement('gmpx-place-data-provider');
    expect(el).toBeInstanceOf(PlaceDataProvider);
  });

  it('does not reflect place property back to attribute', async () => {
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider></gmpx-place-data-provider>
    `);
    provider.place = 'id0';
    await env.waitForStability();

    expect(provider.getAttribute('place')).toBeNull();
  });

  it('fetches fields provided by attribute', async () => {
    const {fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id1" fields="field1 field2">
      </gmpx-place-data-provider>
    `);

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: ['field1', 'field2']
    });
  });

  it('fetches fields from one child', async () => {
    const {fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id2">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({fields: ['displayName']});
  });

  it('fetches fields from multiple children', async () => {
    const {fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id3">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
        <gmpx-test-consumer field="rating">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    expect(fetchFieldsSpy).toHaveBeenCalledTimes(1);
    const arg = fetchFieldsSpy.calls.mostRecent().args[0];
    expect(arg.fields.sort()).toEqual(['displayName', 'rating']);
  });

  it('fetches missing fields on a Place', async () => {
    const fetchFieldsSpy = jasmine.createSpy('fetchFields');
    const place = makeFakePlace({
      id: 'id4',
      rating: 4.5,
    });
    attachFetchFieldsSpy(place, fetchFieldsSpy);

    const {provider} = await prepareState(html`
      <gmpx-place-data-provider .place=${place}>
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    const consumer = provider.children[0];

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({fields: ['displayName']});
    expect(consumer.matches('[no-data]')).toBeFalse();
  });

  it('fetches missing fields on a PlaceResult', async () => {
    const placeResult: PlaceResult = {
      place_id: 'id5',
      rating: 4.5,
    };
    const {provider, fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider .place=${placeResult}>
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    const consumer = provider.children[0];

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({fields: ['displayName']});
    expect(consumer.matches('[no-data]')).toBeFalse();
  });

  it(`doesn't fetch missing fields with auto-fetch-disabled`, async () => {
    const fetchFieldsSpy = jasmine.createSpy('fetchFields');
    const place = makeFakePlace({
      id: 'id6',
      rating: 4.5,
      fetchFields: fetchFieldsSpy,
    });
    attachFetchFieldsSpy(place, fetchFieldsSpy);

    const {provider} = await prepareState(html`
      <gmpx-place-data-provider .place=${place} auto-fetch-disabled>
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    const consumer = provider.children[0];

    expect(fetchFieldsSpy).not.toHaveBeenCalled();
    expect(consumer.matches('[no-data]')).toBeTrue();
  });

  it('ignores auto-fetch-disabled when using a place ID', async () => {
    const {fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id7" auto-fetch-disabled>
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({fields: ['displayName']});
  });

  it(`doesn't fetch when a new child is attached`, async () => {
    const {provider, fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id8-A">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    const consumer = new TestConsumer();
    consumer.field = 'rating';
    provider.appendChild(consumer);
    await env.waitForStability();

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({fields: ['displayName']});
  });

  it(`does not re-fetch when same place object is set again`, async () => {
    const fetchFieldsSpy = jasmine.createSpy('fetchFields');
    const place = makeFakePlace({id: 'id8-D'});
    attachFetchFieldsSpy(place, fetchFieldsSpy);

    const {provider} = await prepareState(html`
      <gmpx-place-data-provider .place=${place}>
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    fetchFieldsSpy.calls.reset();
    provider.place = provider.place;
    await env.waitForStability();

    expect(fetchFieldsSpy).not.toHaveBeenCalled();
  });

  // Issue #305: Prevents infinite error loops when a requesterror handler re-renders with the same Place instance.
  it('does not enter an error loop when gmpx-requesterror listener re-assigns identical place', async () => {
    const quotaError = new Error(
        'PLACES_GET_PLACE: 429 RESOURCE_EXHAUSTED: Quota exceeded');
    const fetchFieldsSpy =
        jasmine.createSpy('fetchFields').and.rejectWith(quotaError);
    const place = makeFakePlace({
      id: 'test-data-provider-quota',
      fetchFields: fetchFieldsSpy,
    });

    const root = env.render(html`
      <gmpx-place-data-provider .place=${place}>
        <gmpx-test-consumer field="displayName"></gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    const provider =
        root.querySelector<PlaceDataProvider>('gmpx-place-data-provider')!;

    const listenerSpy = jasmine.createSpy('listener').and.callFake(() => {
      provider.place = place;
    });
    provider.addEventListener('gmpx-requesterror', listenerSpy);

    await env.waitForStability();

    expect(fetchFieldsSpy).toHaveBeenCalledTimes(1);
    expect(listenerSpy).toHaveBeenCalledTimes(1);
  });

  it('fetches when the place is changed', async () => {
    const {provider, fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id9">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    fetchFieldsSpy.calls.reset();

    provider.place = 'id10';
    await env.waitForStability();

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: ['displayName', 'attributions'],
    });
  });

  it(`fetches new children's fields when the place is changed`, async () => {
    const {provider, fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id11">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    fetchFieldsSpy.calls.reset();

    const consumer = new TestConsumer();
    consumer.field = 'rating';
    provider.appendChild(consumer);
    provider.place = 'id12';
    await env.waitForStability();

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: ['displayName', 'attributions', 'rating'],
    });
  });

  it(`stops fetching the fields from a removed node`, async () => {
    const {provider, fetchFieldsSpy} = await prepareState(html`
      <gmpx-place-data-provider place="id13">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
        <gmpx-test-consumer field="rating">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);
    fetchFieldsSpy.calls.reset();

    provider.removeChild(provider.children[1]);
    provider.place = 'id14';
    await env.waitForStability();

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: ['displayName', 'attributions'],
    });
  });

  it(`caches Place objects`, async () => {
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider place="id15">
        <gmpx-test-consumer field="displayName">
        </gmpx-test-consumer>
      </gmpx-place-data-provider>
    `);

    const consumer =
        provider.querySelector<TestConsumer>('gmpx-test-consumer')!;
    const place = consumer.contextPlace;

    provider.place = 'id16';
    await env.waitForStability();
    provider.place = 'id15';
    await env.waitForStability();

    expect(consumer.contextPlace).toBe(place);
  });

  it('shows the loading slot while loading', async () => {
    const deferred = new Deferred<{place: Place}>();
    const {provider} = await prepareState(
        html`
          <gmpx-place-data-provider place="id17"></gmpx-place-data-provider>
        `,
        () => deferred.promise,
    );

    expect(provider.renderRoot.querySelector('slot')?.name)
        .toBe('initial-loading');
  });

  it('shows the default slot, emits no error event when loaded', async () => {
    const deferred = new Deferred<{place: Place}>();
    const {provider} = await prepareState(
        html`
          <gmpx-place-data-provider place="id18">
            <span slot="initial-loading">Loading</span>
            Loaded
          </gmpx-place-data-provider>
        `,
        () => deferred.promise,
    );

    const dispatchEventSpy = spyOn(provider, 'dispatchEvent');
    deferred.resolve({place: makeFakePlace({id: ''})});
    await env.waitForStability();

    expect(provider.renderRoot.querySelector('slot')?.name).toBe('');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('shows the error slot, emits event when fetchFields rejects', async () => {
    const deferred = new Deferred<{place: Place}>();
    const {provider} = await prepareState(
        html`
          <gmpx-place-data-provider place="id19-A">
            <span slot="initial-loading">Loading</span>
            Loaded
          </gmpx-place-data-provider>
        `,
        () => deferred.promise,
    );

    const dispatchEventSpy = spyOn(provider, 'dispatchEvent');
    const error = new Error('some network error');
    deferred.reject(error);
    await env.waitForStability();

    expect(provider.renderRoot.querySelector('slot')?.name).toBe('error');
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({type: 'gmpx-requesterror', error}));
  });

  it('shows error slot when API loading fails, with Place ID', async () => {
    const deferred = new Deferred();
    env.importLibrarySpy?.and.returnValue(deferred.promise);
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider place="id19-B">
        <span slot="initial-loading">Loading</span>
        Loaded
      </gmpx-place-data-provider>
    `);

    const dispatchEventSpy = spyOn(provider, 'dispatchEvent');
    const error = new Error('API not found');
    deferred.reject(error);
    await env.waitForStability();

    expect(provider.renderRoot.querySelector('slot')?.name).toBe('error');
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({type: 'gmpx-requesterror', error}));
  });

  it('shows error slot when API loading fails, with PlaceResult', async () => {
    const deferred = new Deferred();
    env.importLibrarySpy?.and.returnValue(deferred.promise);
    const placeResult: PlaceResult = {place_id: 'id19-C'};
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider .place=${placeResult}>
        <span slot="initial-loading">Loading</span>
        Loaded
      </gmpx-place-data-provider>
    `);

    const dispatchEventSpy = spyOn(provider, 'dispatchEvent');
    const error = new Error('API not found');
    deferred.reject(error);
    await env.waitForStability();

    expect(provider.renderRoot.querySelector('slot')?.name).toBe('error');
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({type: 'gmpx-requesterror', error}));
  });

  it('appends Place Attribution as child if none exists', async () => {
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider place="id20-A"></gmpx-place-data-provider>
    `);

    expect(provider.querySelectorAll('gmpx-place-attribution')).toHaveSize(1);
  });

  it('does not append Place Attribution if one already exists', async () => {
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider place="id20-B">
        <gmpx-place-attribution></gmpx-place-attribution>
      </gmpx-place-data-provider>
    `);

    expect(provider.querySelectorAll('gmpx-place-attribution')).toHaveSize(1);
  });

  it('does not append Place Attribution again when place changes', async () => {
    const {provider} = await prepareState(html`
      <gmpx-place-data-provider place="id20-C"></gmpx-place-data-provider>
    `);

    provider.place = 'id20-D';
    await env.waitForStability();

    expect(provider.querySelectorAll('gmpx-place-attribution')).toHaveSize(1);
  });

  it('fetches from Place Details when Place.fetchFields() is not available',
     async () => {
       spyOn(env.fakeGoogleMapsHarness!, 'getDetailsHandler')
           .and.returnValue({result: {name: 'Foo Inc'}, status: 'OK'});

       const {provider} = await prepareState(
           html`
            <gmpx-place-data-provider place="id21">
              <gmpx-test-consumer field="displayName">
              </gmpx-test-consumer>
            </gmpx-place-data-provider>`,
           () => {
             throw new Error(
                 'Place.prototype.fetchFields() is not available in the SDK!');
           });

       expect(env.fakeGoogleMapsHarness!.getDetailsHandler)
           .toHaveBeenCalledOnceWith({placeId: 'id21', fields: ['name']});
       const consumer = provider.children[0] as TestConsumer;
       expect(consumer.contextPlace?.displayName).toBe('Foo Inc');
     });

  describe('refresh', () => {
    it(`fetches new child's field when refresh is called with place id`, async () => {
      const {provider, fetchFieldsSpy} = await prepareState(html`
        <gmpx-place-data-provider place="id8-B">
          <gmpx-test-consumer field="displayName">
          </gmpx-test-consumer>
        </gmpx-place-data-provider>
      `);

      fetchFieldsSpy.calls.reset();
      const consumer = new TestConsumer();
      consumer.field = 'rating';
      provider.appendChild(consumer);
      await provider.refresh();
      await env.waitForStability();

      expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
        fields: ['displayName', 'attributions', 'rating'],
      });
    });

    it(`fetches new child's field when refresh is called with place obj`, async () => {
      const fetchFieldsSpy = jasmine.createSpy('fetchFields');
      const place = makeFakePlace({id: 'id8-C'});
      attachFetchFieldsSpy(place, fetchFieldsSpy);

      const {provider} = await prepareState(html`
        <gmpx-place-data-provider .place=${place}>
          <gmpx-test-consumer field="displayName">
          </gmpx-test-consumer>
        </gmpx-place-data-provider>
      `);

      fetchFieldsSpy.calls.reset();
      const consumer = new TestConsumer();
      consumer.field = 'rating';
      provider.appendChild(consumer);
      await provider.refresh();
      await env.waitForStability();

      expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
        fields: ['displayName', 'attributions', 'rating'],
      });
    });

    it('re-fetches fields on demand when refresh is called with Place object', async () => {
      const fetchFieldsSpy = jasmine.createSpy('fetchFields').and.resolveTo({});
      const place = makeFakePlace({
        id: 'test-data-provider-refresh',
        fetchFields: fetchFieldsSpy,
      });

      const root = env.render(html`
        <gmpx-place-data-provider .place=${place}>
          <gmpx-test-consumer field="displayName"></gmpx-test-consumer>
        </gmpx-place-data-provider>
      `);
      await env.waitForStability();
      fetchFieldsSpy.calls.reset();

      const provider =
          root.querySelector<PlaceDataProvider>('gmpx-place-data-provider')!;
      await provider.refresh();
      await env.waitForStability();

      expect(fetchFieldsSpy).toHaveBeenCalledTimes(1);
    });

    it('sets error state, dispatches gmpx-requesterror event, and rejects when refresh fails', async () => {
      const fetchFieldsSpy = jasmine.createSpy('fetchFields').and.rejectWith(
          new Error('Quota exceeded'));
      const place = makeFakePlace({
        id: 'test-data-provider-refresh-error',
        fetchFields: fetchFieldsSpy,
      });

      const requestErrorListener = jasmine.createSpy('requestErrorListener');
      const root = env.render(html`
        <gmpx-place-data-provider
          .place=${place}
          @gmpx-requesterror=${(e: Event) => requestErrorListener(e)}
        >
          <gmpx-test-consumer field="displayName"></gmpx-test-consumer>
          <div slot="error">Custom Error Content</div>
        </gmpx-place-data-provider>
      `);
      await env.waitForStability();
      fetchFieldsSpy.calls.reset();
      requestErrorListener.calls.reset();

      const provider =
          root.querySelector<PlaceDataProvider>('gmpx-place-data-provider')!;

      await expectAsync(provider.refresh()).toBeRejectedWithError('Quota exceeded');
      await env.waitForStability();

      expect(fetchFieldsSpy).toHaveBeenCalledTimes(1);
      expect(requestErrorListener).toHaveBeenCalledTimes(1);
      expect(provider.renderRoot.querySelector('slot')?.name).toBe('error');
    });
  });

  describe('outdated updates', () => {
    let fetches: Map<string, Deferred<{place: Place}>>;

    function makePlaceWithDeferredFetch(id: string): Place {
      return makeFakePlace({
        id,
        fetchFields: () => {
          const deferred = new Deferred<{place: Place}>();
          fetches.set(id, deferred);
          return deferred.promise;
        },
      });
    }

    async function prepareDeferredState(place: string|Place|PlaceResult) {
      fetches = new Map();
      env.fakeGoogleMapsHarness!.placeConstructor = (options) =>
          makePlaceWithDeferredFetch(options.id!);
      const requestErrorListener = jasmine.createSpy('requestErrorListener');
      const root = env.render(html`
        <gmpx-place-data-provider
          .place=${place}
          @gmpx-requesterror=${(e: Event) => requestErrorListener(e)}
        >
          <gmpx-test-consumer></gmpx-test-consumer>
        </gmpx-place-data-provider>
      `);
      await env.waitForStability();
      const provider =
          root.querySelector<PlaceDataProvider>('gmpx-place-data-provider')!;
      const consumer =
          provider.querySelector<TestConsumer>('gmpx-test-consumer')!;
      return {provider, consumer, requestErrorListener};
    }

    function getSlotName(provider: PlaceDataProvider) {
      return provider.renderRoot.querySelector('slot')?.name;
    }

    it('ignores an outdated fetch error, with Place ID', async () => {
      const {provider, consumer, requestErrorListener} =
          await prepareDeferredState('id22-A');
      provider.place = 'id22-B';
      await env.waitForStability();
      fetches.get('id22-B')!.resolve({place: makeFakePlace({id: 'id22-B'})});
      await env.waitForStability();

      fetches.get('id22-A')!.reject(new Error('some network error'));
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('');
      expect(requestErrorListener).not.toHaveBeenCalled();
      expect(consumer.contextPlace?.id).toBe('id22-B');
    });

    it('keeps loading when an outdated fetch succeeds first', async () => {
      const {provider, consumer} = await prepareDeferredState('id23-A');
      provider.place = 'id23-B';
      await env.waitForStability();

      fetches.get('id23-A')!.resolve({place: makeFakePlace({id: 'id23-A'})});
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('initial-loading');
      expect(consumer.contextPlace?.id).toBe('id23-B');
    });

    it('ignores an outdated fetch error, with Place', async () => {
      const {provider, consumer, requestErrorListener} =
          await prepareDeferredState(makePlaceWithDeferredFetch('id24-A'));
      provider.place = makePlaceWithDeferredFetch('id24-B');
      await env.waitForStability();
      fetches.get('id24-B')!.resolve({place: makeFakePlace({id: 'id24-B'})});
      await env.waitForStability();

      fetches.get('id24-A')!.reject(new Error('some network error'));
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('');
      expect(requestErrorListener).not.toHaveBeenCalled();
      expect(consumer.contextPlace?.id).toBe('id24-B');
    });

    it('ignores an outdated fetch error, with PlaceResult', async () => {
      const {provider, consumer, requestErrorListener} =
          await prepareDeferredState({place_id: 'id25-A'});
      provider.place = {place_id: 'id25-B'};
      await env.waitForStability();
      fetches.get('id25-B')!.resolve({place: makeFakePlace({id: 'id25-B'})});
      await env.waitForStability();

      fetches.get('id25-A')!.reject(new Error('some network error'));
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('');
      expect(requestErrorListener).not.toHaveBeenCalled();
      expect(consumer.contextPlace?.id).toBe('id25-B');
    });

    it('renders nothing when a fetch succeeds after place is cleared',
       async () => {
         const {provider, consumer} = await prepareDeferredState('id26');
         provider.place = undefined;
         await env.waitForStability();

         fetches.get('id26')!.resolve({place: makeFakePlace({id: 'id26'})});
         await env.waitForStability();

         expect(provider.renderRoot.querySelector('slot')).toBeNull();
         expect(consumer.contextPlace).toBeUndefined();
       });

    it('renders nothing when a fetch fails after place is cleared',
       async () => {
         const {provider, requestErrorListener} =
             await prepareDeferredState('id27');
         provider.place = undefined;
         await env.waitForStability();

         fetches.get('id27')!.reject(new Error('some network error'));
         await env.waitForStability();

         expect(provider.renderRoot.querySelector('slot')).toBeNull();
         expect(requestErrorListener).not.toHaveBeenCalled();
       });

    it('keeps a newer Place when an outdated PlaceResult is converted',
       async () => {
         const deferred = new Deferred<unknown>();
         env.importLibrarySpy?.and.returnValue(deferred.promise);
         const {provider, consumer} =
             await prepareDeferredState({place_id: 'id28-A'});
         provider.place = makePlaceWithDeferredFetch('id28-B');
         await env.waitForStability();
         fetches.get('id28-B')!.resolve({place: makeFakePlace({id: 'id28-B'})});
         await env.waitForStability();

         deferred.resolve(
             await env.fakeGoogleMapsHarness!.importLibrary('places'));
         await env.waitForStability();

         expect(consumer.contextPlace?.id).toBe('id28-B');
         expect(getSlotName(provider)).toBe('');
       });

    it('keeps a newer Place when an outdated Place ID is looked up',
       async () => {
         const deferred = new Deferred<unknown>();
         env.importLibrarySpy?.and.returnValue(deferred.promise);
         const {provider, consumer} = await prepareDeferredState('id29-A');
         provider.place = makePlaceWithDeferredFetch('id29-B');
         await env.waitForStability();
         fetches.get('id29-B')!.resolve({place: makeFakePlace({id: 'id29-B'})});
         await env.waitForStability();

         deferred.resolve(
             await env.fakeGoogleMapsHarness!.importLibrary('places'));
         await env.waitForStability();

         expect(consumer.contextPlace?.id).toBe('id29-B');
         expect(getSlotName(provider)).toBe('');
       });

    it('rejects an outdated refresh without setting the error state',
       async () => {
         const {provider, consumer, requestErrorListener} =
             await prepareDeferredState('id30-A');
         fetches.get('id30-A')!.resolve({place: makeFakePlace({id: 'id30-A'})});
         await env.waitForStability();
         const refreshPromise = provider.refresh();
         await env.waitForStability();
         provider.place = 'id30-B';
         await env.waitForStability();
         fetches.get('id30-B')!.resolve({place: makeFakePlace({id: 'id30-B'})});
         await env.waitForStability();

         fetches.get('id30-A')!.reject(new Error('some network error'));

         await expectAsync(refreshPromise)
             .toBeRejectedWithError('some network error');
         await env.waitForStability();
         expect(getSlotName(provider)).toBe('');
         expect(requestErrorListener).not.toHaveBeenCalled();
         expect(consumer.contextPlace?.id).toBe('id30-B');
       });

    it('loads a place set during a refresh, ignoring the refresh', async () => {
      const {provider, consumer} = await prepareDeferredState('id31-A');
      fetches.get('id31-A')!.resolve({place: makeFakePlace({id: 'id31-A'})});
      await env.waitForStability();
      const refreshPromise = provider.refresh();
      await env.waitForStability();
      provider.place = 'id31-B';
      await env.waitForStability();

      fetches.get('id31-A')!.resolve({place: makeFakePlace({id: 'id31-A'})});
      await refreshPromise;
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('initial-loading');

      fetches.get('id31-B')!.resolve({place: makeFakePlace({id: 'id31-B'})});
      await env.waitForStability();

      expect(getSlotName(provider)).toBe('');
      expect(consumer.contextPlace?.id).toBe('id31-B');
    });
  });
});
