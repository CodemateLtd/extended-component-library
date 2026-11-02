/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, test} from '@playwright/test';

import {openSampleApp, SAMPLE_APP_CONFIGS, searchCollege} from './sample_apps.js';

const BOOTSTRAP_URL = 'https://maps.googleapis.com/maps/api/js?*';
const PLACES_RPC_URL =
    'https://places.googleapis.com/$rpc/google.maps.places.v1.Places/';

/**
 * Starts collecting the page's uncaught errors and unhandled rejections.
 * Call it before the page loads.
 */
function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

/**
 * Waits until the page has stopped loading, so that late errors are
 * collected, then returns the page errors.
 */
async function settledPageErrors(page, errors) {
  await page.waitForLoadState('networkidle');
  return errors;
}

/**
 * Opens a sample app without waiting for Google Maps, for a page where the
 * Maps JavaScript API can't load.
 */
async function openSampleAppWithoutMaps(page, {title, port}) {
  await page.goto(`http://localhost:${port}`);
  await expect(page).toHaveTitle(`GMPX - ${title}`);
}

for (const app of SAMPLE_APP_CONFIGS) {
  test.describe(`${app.title} failure states`, () => {
    // No page error check: the Place Picker leaves the rejection of its
    // library import unhandled when the Maps JavaScript API can't load.
    test('reports that Google Maps failed to load', async ({page}) => {
      await page.route(BOOTSTRAP_URL, (route) => route.abort());

      await openSampleAppWithoutMaps(page, app);

      await expect(page.getByRole('status'))
          .toHaveText(
              'Couldn\'t load Google Maps. ' +
              'Check your connection and reload the page.');
    });

    // No page error check: the Maps JavaScript API itself throws uncaught
    // errors after it rejects the key.
    test('reports that the API key was rejected', async ({page}) => {
      await page.route(BOOTSTRAP_URL, (route) => {
        const url = new URL(route.request().url());
        url.searchParams.set('key', 'invalid-key');
        return route.continue({url: url.toString()});
      });

      await openSampleApp(page, app);

      await expect(page.getByRole('status'))
          .toHaveText(
              'Google Maps rejected the API key. ' +
              'See the browser console for details.');
    });

    test('reports that no API key is set', async ({page}) => {
      const pageErrors = collectPageErrors(page);
      // The app was started with a key, which it serves in its HTML (JS) or
      // in a compiled module (React and Angular). Serve it without the key.
      const key = process.env.MAPS_API_KEY;
      expect(key, 'MAPS_API_KEY must hold the key the app serves').toBeTruthy();
      await page.route(`http://localhost:${app.port}/**`, async (route) => {
        const response = await route.fetch();
        const contentType = response.headers()['content-type'] ?? '';
        if (!/html|javascript/.test(contentType)) {
          return route.fulfill({response});
        }
        const body = (await response.text()).replaceAll(key, '');
        return route.fulfill({response, body});
      });

      await openSampleApp(page, app);

      await expect(page.getByRole('status'))
          .toHaveText(
              'No Maps API key is set. Set MAPS_API_KEY and restart the app.');
      expect(await settledPageErrors(page, pageErrors)).toEqual([]);
      await expect(page.getByRole('status'))
          .toHaveText(
              'No Maps API key is set. Set MAPS_API_KEY and restart the app.');
    });

    test('reports a failed search and keeps the map empty', async ({page}) => {
      const pageErrors = collectPageErrors(page);
      await page.route(`${PLACES_RPC_URL}SearchText`, (route) => route.abort());

      await openSampleApp(page, app);
      await searchCollege(page, 'mit');

      await expect(page.getByRole('status'))
          .toHaveText('Couldn\'t search for colleges. Try again.');
      await expect(page.locator('gmp-map')).toHaveAttribute('zoom', '4');
      expect(await page.locator('gmpx-place-overview')
                 .evaluate((element) => element.place))
          .toBeUndefined();
      expect(await settledPageErrors(page, pageErrors)).toEqual([]);
    });

    test('reports failed place details in the overview', async ({page}) => {
      const pageErrors = collectPageErrors(page);
      // Let the picker fetch its fields, and fail the overview's own request,
      // whose field mask asks for the rating. The Maps JavaScript API sends
      // the field mask in the x-goog-fieldmask header.
      await page.route(`${PLACES_RPC_URL}GetPlace`, (route) => {
        const fieldMask = route.request().headers()['x-goog-fieldmask'] ?? '';
        return fieldMask.split(',').includes('rating') ? route.abort() :
                                                         route.continue();
      });

      await openSampleApp(page, app);
      await searchCollege(page, 'mit');

      await expect(page.getByRole('status'))
          .toHaveText('Couldn\'t load details for this college. Try again.');
      await expect(page.locator('gmpx-place-overview'))
          .toContainText('Oops! Something went wrong.');
      await expect(page.locator('gmp-map')).toHaveAttribute('zoom', '16');
      expect(await settledPageErrors(page, pageErrors)).toEqual([]);
    });
  });
}
