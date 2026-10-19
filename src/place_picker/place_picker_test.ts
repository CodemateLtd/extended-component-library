/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)

import {html, TemplateResult} from 'lit';

import {Environment} from '../testing/environment.js';
import {FakeMapElement, FakePlaceAutocompleteElement} from '../testing/fake_gmp_components.js';
import {makeFakePlace} from '../testing/fake_place.js';
import {getDeepActiveElement} from '../utils/deep_element_access.js';
import type {Place, PlaceResult} from '../utils/googlemaps_types.js';

import {PLACE_DATA_FIELDS, PlacePicker} from './place_picker.js';

const FAKE_BOUNDS = {
  east: 1,
  north: 1,
  south: -1,
  west: -1,
} as unknown as google.maps.LatLngBounds;

const OTHER_FAKE_BOUNDS = {
  east: 2,
  north: 2,
  south: -2,
  west: -2,
} as unknown as google.maps.LatLngBounds;

const FAKE_PLACE_FROM_AUTOCOMPLETE = makeFakePlace({
  id: 'FAKE_AUTOCOMPLETE_PLACE_ID',
  displayName: 'Fake Place from Autocomplete',
});

const FAKE_PLACE_FROM_QUERY = makeFakePlace({
  id: 'FAKE_QUERY_PLACE_ID',
  formattedAddress: '123 Main St, City Name, CA 00000',
  displayName: '123 Main St'
});

describe('PlacePicker', () => {
  const env = new Environment();

  beforeAll(() => {
    env.defineFakeMapElement();
  });

  beforeEach(() => {
    // Create a custom stub for `Place.searchByText()`
    spyOn(env.fakeGoogleMapsHarness!, 'searchByTextHandler').and.returnValue({
      places: [FAKE_PLACE_FROM_QUERY]
    });

    // Define a fake Circle class
    const fakeCircle = jasmine.createSpyObj('Circle', ['getBounds']);
    env.fakeGoogleMapsHarness!.libraries['maps'].Circle =
        jasmine.createSpy().and.returnValue(fakeCircle);
  });

  async function prepareState(template?: TemplateResult) {
    const root =
        env.render(template ?? html`<gmpx-place-picker></gmpx-place-picker>`);
    const picker = root.querySelector<PlacePicker>('gmpx-place-picker')!;

    await env.waitForStability();

    const autocomplete =
        picker.renderRoot.querySelector<FakePlaceAutocompleteElement>(
            'gmp-place-autocomplete')!;
    const input = autocomplete.input;
    const searchButton =
        picker.renderRoot.querySelector<HTMLButtonElement>('.search-button')!;
    const clearButton =
        picker.renderRoot.querySelector<HTMLButtonElement>('.clear-button')!;
    return {root, picker, autocomplete, input, searchButton, clearButton};
  }

  async function enterQueryText(input: HTMLInputElement, query = 'some text') {
    input.value = query;
    input.dispatchEvent(
        new InputEvent('input', {bubbles: true, composed: true}));
    await env.waitForStability();
  }

  async function pressKey(input: HTMLInputElement, key: string) {
    input.dispatchEvent(
        new KeyboardEvent('keydown', {key, bubbles: true, composed: true}));
    await env.waitForStability();
  }

  async function selectPrediction(
      autocomplete: FakePlaceAutocompleteElement, place: Place) {
    const event = new Event('gmp-select');
    Object.defineProperty(
        event, 'placePrediction', {value: {toPlace: () => place}});
    autocomplete.dispatchEvent(event);
    await env.waitForStability();
  }

  function makeFakeMap(bounds?: google.maps.LatLngBounds) {
    const map = jasmine.createSpyObj<google.maps.Map>(
        'Map', ['addListener', 'getBounds']);
    map.getBounds.and.returnValue(bounds);
    const listener = jasmine.createSpyObj('MapsEventListener', ['remove']);
    map.addListener.and.returnValue(listener);
    return {map, listener};
  }

  it('is defined', () => {
    const el = document.createElement('gmpx-place-picker');
    expect(el).toBeInstanceOf(PlacePicker);
  });

  it('delegates focus to the autocomplete input on focus()', async () => {
    const {picker, input} = await prepareState();

    picker.focus();

    expect(getDeepActiveElement()).toBe(input);
  });

  it(`doesn't use the legacy Autocomplete widget`, async () => {
    await prepareState();

    expect(env.fakeGoogleMapsHarness!.autocompleteConstructor)
        .not.toHaveBeenCalled();
  });

  it('initializes Place Autocomplete widget with minimum configs', async () => {
    const {picker, autocomplete, searchButton, clearButton} =
        await prepareState();

    expect(autocomplete).toBeInstanceOf(FakePlaceAutocompleteElement);
    expect(autocomplete.includedPrimaryTypes).toBeNull();
    expect(autocomplete.includedRegionCodes).toBeNull();
    expect(autocomplete.locationBias).toBeNull();
    expect(autocomplete.locationRestriction).toBeNull();
    expect(autocomplete.placeholder).toBeNull();
    expect(autocomplete.noClearButton).toBeTrue();
    expect(autocomplete.noInputIcon).toBeTrue();
    expect(picker.value).toBeUndefined();
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeTrue();
  });

  it(`initializes Place Autocomplete widget based on attributes`, async () => {
    const {autocomplete} = await prepareState(html`
      <gmpx-place-picker
        country="us ca"
        location-bias="12,34"
        placeholder="Search nearby places"
        radius="1000"
        type="street_address"
      ></gmpx-place-picker>
    `);

    expect(autocomplete.includedPrimaryTypes).toEqual(['street_address']);
    expect(autocomplete.includedRegionCodes).toEqual(['us', 'ca']);
    expect(autocomplete.locationBias)
        .toEqual({center: {lat: 12, lng: 34}, radius: 1000});
    expect(autocomplete.locationRestriction).toBeNull();
    expect(autocomplete.placeholder).toBe('Search nearby places');
  });

  it(`restricts predictions to the circle's bounds given strict-bounds`,
     async () => {
       // The call to `.Circle.and.exec()` grabs a reference to the Circle
       // spy object without recording a call to the constructor spy (e.g.
       // `.Circle()`)
       env.fakeGoogleMapsHarness!.libraries['maps']
           .Circle.and.exec()
           .getBounds.and.returnValue(FAKE_BOUNDS);
       const {autocomplete} = await prepareState(html`
         <gmpx-place-picker
           location-bias="12,34"
           radius="1000"
           strict-bounds
         ></gmpx-place-picker>
       `);

       expect(env.fakeGoogleMapsHarness!.libraries['maps'].Circle)
           .toHaveBeenCalledOnceWith(
               {center: {lat: 12, lng: 34}, radius: 1000});
       expect(autocomplete.locationBias).toBeNull();
       expect(autocomplete.locationRestriction).toBe(FAKE_BOUNDS);
     });

  it(`updates widget options when relevant props change`, async () => {
    env.fakeGoogleMapsHarness!.libraries['maps']
        .Circle.and.exec()
        .getBounds.and.returnValue(FAKE_BOUNDS);
    const {picker, autocomplete} = await prepareState();

    picker.country = ['uk'];
    await env.waitForStability();
    expect(autocomplete.includedRegionCodes).toEqual(['uk']);

    picker.type = 'restaurant';
    await env.waitForStability();
    expect(autocomplete.includedPrimaryTypes).toEqual(['restaurant']);

    picker.placeholder = 'Search nearby places';
    await env.waitForStability();
    expect(autocomplete.placeholder).toBe('Search nearby places');

    picker.radius = 1000;
    await env.waitForStability();
    picker.locationBias = {lat: 12, lng: 34};
    await env.waitForStability();
    expect(autocomplete.locationBias)
        .toEqual({center: {lat: 12, lng: 34}, radius: 1000});

    picker.radius = 2000;
    await env.waitForStability();
    expect(autocomplete.locationBias)
        .toEqual({center: {lat: 12, lng: 34}, radius: 2000});

    picker.strictBounds = true;
    await env.waitForStability();
    expect(autocomplete.locationRestriction).toBe(FAKE_BOUNDS);
  });

  it(`resets the place type to none (= all) given a falsy value`, async () => {
    const {picker, autocomplete} = await prepareState(
        html`<gmpx-place-picker type="restaurant"></gmpx-place-picker>`);

    picker.type = '';
    await env.waitForStability();

    expect(autocomplete.includedPrimaryTypes).toBeNull();
  });

  it(`doesn't define a bias when only location bias is specified`, async () => {
    const {picker, autocomplete} = await prepareState();

    picker.locationBias = {lat: 12, lng: 34};
    await env.waitForStability();

    expect(autocomplete.locationBias).toBeNull();
  });

  it(`doesn't define a bias when only radius is specified`, async () => {
    const {picker, autocomplete} = await prepareState();

    picker.radius = 1000;
    await env.waitForStability();

    expect(autocomplete.locationBias).toBeNull();
  });

  it(`enables search & clear buttons on user input`, async () => {
    const dispatchEventSpy = spyOn(PlacePicker.prototype, 'dispatchEvent');
    const {picker, input, searchButton, clearButton} = await prepareState();

    await enterQueryText(input);

    expect(picker.value).toBeUndefined();
    expect(searchButton.disabled).toBeFalse();
    expect(clearButton.hidden).toBeFalse();
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it(`disables search & clear buttons when user deletes all text`, async () => {
    const dispatchEventSpy = spyOn(PlacePicker.prototype, 'dispatchEvent');
    const {picker, input, searchButton, clearButton} = await prepareState();

    await enterQueryText(input);
    await enterQueryText(input, '');

    expect(picker.value).toBeUndefined();
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeTrue();
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it(`sets value based on user selection and fires event`, async () => {
    const dispatchEventSpy = spyOn(PlacePicker.prototype, 'dispatchEvent');
    const fetchFieldsSpy =
        spyOn(FAKE_PLACE_FROM_AUTOCOMPLETE, 'fetchFields').and.callThrough();
    const {picker, autocomplete, input, searchButton, clearButton} =
        await prepareState();

    await enterQueryText(input);
    await selectPrediction(autocomplete, FAKE_PLACE_FROM_AUTOCOMPLETE);

    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: [...PLACE_DATA_FIELDS],
    });
    expect(picker.value).toBe(FAKE_PLACE_FROM_AUTOCOMPLETE);
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeFalse();
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(new Event('gmpx-placechange'));
  });

  it(`dispatches request error event when selected place fails to load`,
     async () => {
       const error = new Error('some network error');
       spyOn(FAKE_PLACE_FROM_AUTOCOMPLETE, 'fetchFields').and.rejectWith(error);
       const {picker, autocomplete, input} = await prepareState();

       await enterQueryText(input);
       const dispatchEventSpy = spyOn(picker, 'dispatchEvent');
       await selectPrediction(autocomplete, FAKE_PLACE_FROM_AUTOCOMPLETE);

       expect(picker.value).toBeUndefined();
       expect(dispatchEventSpy)
           .toHaveBeenCalledOnceWith(
               jasmine.objectContaining({type: 'gmpx-requesterror', error}));
     });

  it(`keeps the input's height while the widget loads`, async () => {
    env.importLibrarySpy!.and.returnValue(new Promise(() => {}));
    const root = env.render(html`<gmpx-place-picker></gmpx-place-picker>`);
    const picker = root.querySelector<PlacePicker>('gmpx-place-picker')!;
    await env.waitForStability();

    expect(picker.renderRoot.querySelector('gmp-place-autocomplete'))
        .toBeNull();
    expect(picker.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it(`sets value to undefined when place's cleared & fires event`, async () => {
    const {picker, autocomplete, input, searchButton, clearButton} =
        await prepareState();

    await enterQueryText(input);
    await selectPrediction(autocomplete, FAKE_PLACE_FROM_AUTOCOMPLETE);

    const dispatchEventSpy = spyOn(PlacePicker.prototype, 'dispatchEvent');
    clearButton.click();
    await env.waitForStability();

    expect(picker.value).toBeUndefined();
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeTrue();
    expect(autocomplete.value).toBe('');
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(new Event('gmpx-placechange'));
  });

  it(`sets value based on place returned by Find Place request`, async () => {
    const {picker, autocomplete, input, searchButton, clearButton} =
        await prepareState(html`
          <gmpx-place-picker location-bias="12,34" radius="1000">
          </gmpx-place-picker>
        `);

    await enterQueryText(input, '123 Main St');

    const fetchFieldsSpy =
        spyOn(FAKE_PLACE_FROM_QUERY, 'fetchFields').and.callThrough();
    searchButton.click();
    await env.waitForStability();

    expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
        .toHaveBeenCalledOnceWith({
          textQuery: '123 Main St',
          fields: ['id'],
          locationBias: {center: {lat: 12, lng: 34}, radius: 1000},
        });
    expect(fetchFieldsSpy).toHaveBeenCalledOnceWith({
      fields: [...PLACE_DATA_FIELDS],
    });
    const place = picker.value;
    expect(place!.id).toBe('FAKE_QUERY_PLACE_ID');
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeFalse();
    expect(autocomplete.value).toBe('123 Main St, City Name, CA 00000');
  });

  it('sets value from fallback GA API when Place.searchByText is not available',
     async () => {
       const {picker, autocomplete, input, searchButton, clearButton} =
           await prepareState(html`
             <gmpx-place-picker location-bias="12,34" radius="1000">
             </gmpx-place-picker>
           `);
       (env.fakeGoogleMapsHarness!.searchByTextHandler as jasmine.Spy)
           .and.throwError(new Error(
               'google.maps.places.Place.searchByText() is not available in the SDK!'));
       spyOn(env.fakeGoogleMapsHarness!, 'findPlaceFromQueryGAHandler')
           .and.returnValue({
             results: [{
               place_id: 'ga123',
               name: 'City Hall',
               formatted_address: '123 Main St, City Name, CA 00000'
             } as PlaceResult],
             status: 'OK'
           });

       await enterQueryText(input, '123 Main St');
       searchButton.click();
       await env.waitForStability();
       await env.waitForStability();  // Seems like this takes two updates

       expect(env.fakeGoogleMapsHarness!.findPlaceFromQueryGAHandler)
           .toHaveBeenCalledOnceWith({
             query: '123 Main St',
             fields: ['place_id'],
             locationBias: {center: {lat: 12, lng: 34}, radius: 1000},
           });

       const place = picker.value;
       expect(place!.id).toBe('ga123');
       expect(searchButton.disabled).toBeTrue();
       expect(clearButton.hidden).toBeFalse();
       expect(autocomplete.value)
           .toBe('City Hall, 123 Main St, City Name, CA 00000');
     });

  it(`searches on Enter when no prediction is highlighted`, async () => {
    const {picker, input} = await prepareState();

    await enterQueryText(input, '123 Main St');
    await pressKey(input, 'Enter');

    expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({textQuery: '123 Main St'}));
    expect(picker.value?.id).toBe('FAKE_QUERY_PLACE_ID');
  });

  it(`leaves Enter to the widget after the user highlights a prediction`,
     async () => {
       const {input} = await prepareState();

       await enterQueryText(input, '123 Main St');
       await pressKey(input, 'ArrowDown');
       await pressKey(input, 'Enter');

       expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
           .not.toHaveBeenCalled();
     });

  it(`searches on Enter again once the user types after arrow keys`,
     async () => {
       const {input} = await prepareState();

       await enterQueryText(input, '123 Main');
       await pressKey(input, 'ArrowUp');
       await enterQueryText(input, '123 Main St');
       await pressKey(input, 'Enter');

       expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
           .toHaveBeenCalledOnceWith(
               jasmine.objectContaining({textQuery: '123 Main St'}));
     });

  it(`searches on Enter again once the user closes predictions with Escape`,
     async () => {
       const {input} = await prepareState();

       await enterQueryText(input, '123 Main St');
       await pressKey(input, 'ArrowDown');
       await pressKey(input, 'Escape');
       await pressKey(input, 'Enter');

       expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
           .toHaveBeenCalledOnceWith(
               jasmine.objectContaining({textQuery: '123 Main St'}));
     });

  it(`sets value to null if no search results and fires event`, async () => {
    const {picker, input, searchButton, clearButton} = await prepareState();

    await enterQueryText(input, '123 Main St');

    (env.fakeGoogleMapsHarness!.searchByTextHandler as jasmine.Spy)
        .and.returnValue({
          places: [],
        });
    const dispatchEventSpy = spyOn(PlacePicker.prototype, 'dispatchEvent');
    searchButton.click();
    await env.waitForStability();

    expect(picker.value).toBeNull();
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeFalse();
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(new Event('gmpx-placechange'));
  });

  it(`dispatches request error event when search is rejected`, async () => {
    const {picker, input, searchButton, clearButton} = await prepareState();

    await enterQueryText(input, '123 Main St');

    const error = new Error('some network error');
    (env.fakeGoogleMapsHarness!.searchByTextHandler as jasmine.Spy)
        .and.throwError(error);
    const dispatchEventSpy = spyOn(picker, 'dispatchEvent');
    searchButton.click();
    await env.waitForStability();

    expect(picker.value).toBeUndefined();
    expect(searchButton.disabled).toBeTrue();
    expect(clearButton.hidden).toBeFalse();
    expect(dispatchEventSpy)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({type: 'gmpx-requesterror', error}));
  });

  it(`moves focus to clear button when searching via keyboard`, async () => {
    const {input, searchButton, clearButton} = await prepareState();

    await enterQueryText(input);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab'}));
    searchButton.focus();
    searchButton.click();
    await env.waitForStability();

    expect(getDeepActiveElement()).toBe(clearButton);
  });

  it(`moves focus to input when clearing via keyboard`, async () => {
    const {input, clearButton} = await prepareState();

    await enterQueryText(input);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Tab'}));
    clearButton.focus();
    clearButton.click();
    await env.waitForStability();

    expect(getDeepActiveElement()).toBe(input);
  });

  it(`biases predictions towards map bounds imperatively via method`,
     async () => {
       const {picker, autocomplete} = await prepareState(html`
         <gmpx-place-picker location-bias="12,34" radius="1000">
         </gmpx-place-picker>
       `);
       const {map} = makeFakeMap(FAKE_BOUNDS);

       await picker.bindTo(map);
       await env.waitForStability();

       expect(map.addListener)
           .toHaveBeenCalledOnceWith('bounds_changed', jasmine.any(Function));
       expect(autocomplete.locationBias).toBe(FAKE_BOUNDS);
     });

  it(`follows the bound map's viewport as it changes`, async () => {
    const {picker, autocomplete} = await prepareState();
    const {map} = makeFakeMap(FAKE_BOUNDS);
    await picker.bindTo(map);

    map.getBounds.and.returnValue(OTHER_FAKE_BOUNDS);
    const boundsChangedHandler = map.addListener.calls.mostRecent().args[1];
    boundsChangedHandler();
    await env.waitForStability();

    expect(autocomplete.locationBias).toBe(OTHER_FAKE_BOUNDS);
  });

  it(`restricts predictions to map bounds given strict-bounds`, async () => {
    const {picker, autocomplete} = await prepareState(
        html`<gmpx-place-picker strict-bounds></gmpx-place-picker>`);
    const {map} = makeFakeMap(FAKE_BOUNDS);

    await picker.bindTo(map);
    await env.waitForStability();

    expect(autocomplete.locationBias).toBeNull();
    expect(autocomplete.locationRestriction).toBe(FAKE_BOUNDS);
  });

  it(`stops following the previous map when bound to another`, async () => {
    const {picker, autocomplete} = await prepareState();
    const {map: firstMap, listener: firstListener} = makeFakeMap(FAKE_BOUNDS);
    const {map: secondMap} = makeFakeMap(OTHER_FAKE_BOUNDS);

    await picker.bindTo(firstMap);
    await picker.bindTo(secondMap);
    await env.waitForStability();

    expect(firstListener.remove).toHaveBeenCalled();
    expect(autocomplete.locationBias).toBe(OTHER_FAKE_BOUNDS);
  });

  it(`biases search towards the bound map's bounds`, async () => {
    const {picker, input, searchButton} = await prepareState();
    const {map} = makeFakeMap(FAKE_BOUNDS);
    await picker.bindTo(map);

    await enterQueryText(input, '123 Main St');
    searchButton.click();
    await env.waitForStability();

    expect(env.fakeGoogleMapsHarness!.searchByTextHandler)
        .toHaveBeenCalledOnceWith(
            jasmine.objectContaining({locationBias: FAKE_BOUNDS}));
  });

  it(`binds to map bounds declaratively via attribute`, async () => {
    const {root} = await prepareState(html`
      <gmpx-place-picker for-map="my-map"></gmpx-place-picker>
      <gmp-map id="my-map"></gmp-map>
    `);
    const mapElement = root.querySelector<FakeMapElement>('gmp-map')!;

    expect(mapElement.innerMap.addListener)
        .toHaveBeenCalledOnceWith('bounds_changed', jasmine.any(Function));
  });

  it(`doesn't bind to map bounds when id matches no element`, async () => {
    const bindToSpy = spyOn(PlacePicker.prototype, 'bindTo');
    await prepareState(html`
      <gmpx-place-picker for-map="my-map"></gmpx-place-picker>
    `);

    expect(bindToSpy).not.toHaveBeenCalled();
  });

  it(`doesn't bind to map bounds when id matches non-Map element`, async () => {
    const bindToSpy = spyOn(PlacePicker.prototype, 'bindTo');
    await prepareState(html`
      <gmpx-place-picker for-map="my-map"></gmpx-place-picker>
      <div id="my-map"></div>
    `);

    expect(bindToSpy).not.toHaveBeenCalled();
  });
});
