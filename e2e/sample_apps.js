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

