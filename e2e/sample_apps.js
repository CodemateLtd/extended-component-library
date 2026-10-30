/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect} from '@playwright/test';

/**
 * List of sample apps that will be tested. Each of these should
 * be started before executing the Playwright tests.
 *
 * `removesMarkerOnClear` says how the app shows that no college is selected:
 * by removing the marker element, or by unsetting the marker's position.
 */
export const SAMPLE_APP_CONFIGS = [
  {
    title: 'React Sample App',
    port: 8001,
    removesMarkerOnClear: true,
  },
  {
    title: 'JS Sample App',
    port: 8002,
    removesMarkerOnClear: false,
  },
  {
    title: 'Angular Sample App',
    port: 8003,
    removesMarkerOnClear: false,
  }
];

/** Map center every sample app shows while no college is selected. */
export const DEFAULT_CENTER = {
  lat: 45,
  lng: -98
};

/** Opens a sample app and waits for its map element to be defined. */
export async function openSampleApp(page, {title, port}) {
  await page.goto(`http://localhost:${port}`);
  await expect(page).toHaveTitle(`GMPX - ${title}`);
  await page.evaluate(() => customElements.whenDefined('gmp-map'));
}

/**
 * Selects a college by text search, which makes a Places request.
 *
 * The input is inside the autocomplete widget's closed shadow root, so the
 * query is typed after clicking the widget, and `Tab` moves to the picker's
 * search button. Returns once the search is sent; the caller waits for the
 * result it expects.
 */
export async function searchCollege(page, query) {
  const picker = page.locator('gmpx-place-picker gmp-place-autocomplete');
  await picker.click();
  await page.keyboard.type(query);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
}

/**
 * Reads an element's coordinate property, such as a map's `center` or a
 * marker's `position`, as `{lat, lng}`, or as `null` or `undefined` if unset.
 *
 * Reads the property rather than the attribute, so it works whether the app
 * set an attribute (React) or a property (JS and Angular).
 */
function readLatLng(locator, property) {
  return locator.evaluate((element, property) => {
    const value = element[property];
    if (value == null) return value;
    const {lat, lng} =
        typeof value.toJSON === 'function' ? value.toJSON() : value;
    return {lat, lng};
  }, property);
}

/**
 * Waits until an element's coordinate property matches `expected` to five
 * decimal places.
 */
export async function expectLatLng(locator, property, expected) {
  await expect.poll(() => readLatLng(locator, property)).toEqual({
    lat: expect.closeTo(expected.lat, 5),
    lng: expect.closeTo(expected.lng, 5),
  });
}
