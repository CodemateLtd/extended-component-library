/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, test} from '@playwright/test';

import {DEFAULT_CENTER, expectLatLng, openSampleApp, SAMPLE_APP_CONFIGS} from './sample_apps.js';

const COLLEGE_LOCATION = {
  lat: 42.3601,
  lng: -71.0942
};

for (const app of SAMPLE_APP_CONFIGS) {
  test(
      `${app.title} preserves picker settings and clears its selection`,
      async ({page}) => {
        await openSampleApp(page, app);

        const picker = page.locator('gmpx-place-picker');
        await expect(picker).toHaveAttribute('for-map', 'gmap');
        await expect(picker).toHaveAttribute('type', 'university');
        await expect(picker).toHaveAttribute('country', 'us ca');

        const autocomplete = picker.locator('gmp-place-autocomplete');
        await expect(autocomplete).toHaveJSProperty(
            'includedPrimaryTypes', ['university']);
        await expect(autocomplete).toHaveJSProperty(
            'includedRegionCodes', ['us', 'ca']);
        await expect.poll(() => autocomplete.evaluate(
            (element) => element.locationBias != null)).toBe(true);

        const overview = page.locator('gmpx-place-overview');
        const map = page.locator('gmp-map');
        const marker = page.locator('gmp-advanced-marker');
        const dataProvider = page.locator(
            'div[slot="overlay"] > gmpx-place-data-provider');
        // Inject a selected Place without making a billable Places request.
        // This still exercises the real picker event and each app's bindings.
        await picker.evaluate(async (element, location) => {
          element.valueInternal = {
            displayName: 'Test College',
            location: new google.maps.LatLng(location),
          };
          element.hideClearButton = false;
          await element.updateComplete;
        }, COLLEGE_LOCATION);
        await expect.poll(() => overview.evaluate(
            (element) => element.place?.displayName)).toBe('Test College');
        await expect.poll(() => dataProvider.evaluate(
            (element) => element.place?.displayName)).toBe('Test College');
        await expect(map).toHaveAttribute('zoom', '16');
        await expectLatLng(map, 'center', COLLEGE_LOCATION);
        await expect(marker).toHaveCount(1);
        await expectLatLng(marker, 'position', COLLEGE_LOCATION);

        await picker.locator('button.clear-button').click();
        await expect(overview).toHaveJSProperty('place', undefined);
        await expect(dataProvider).toHaveJSProperty('place', undefined);
        await expect(map).toHaveAttribute('zoom', '4');
        await expectLatLng(map, 'center', DEFAULT_CENTER);
        if (app.removesMarkerOnClear) {
          await expect(marker).toHaveCount(0);
        } else {
          await expect(marker).toHaveJSProperty('position', null);
        }
      });
}
