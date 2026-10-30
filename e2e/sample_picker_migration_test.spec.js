/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, test} from '@playwright/test';

import {openSampleApp, SAMPLE_APP_CONFIGS} from './sample_apps.js';

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
        await picker.evaluate(async (element) => {
          element.valueInternal = {
            displayName: 'Test College',
            location: new google.maps.LatLng(42.3601, -71.0942),
          };
          element.hideClearButton = false;
          await element.updateComplete;
        });
        await expect.poll(() => overview.evaluate(
            (element) => element.place?.displayName)).toBe('Test College');
        await expect.poll(() => dataProvider.evaluate(
            (element) => element.place?.displayName)).toBe('Test College');
        await expect(map).toHaveAttribute('zoom', '16');
        await expect(marker).toHaveCount(1);

        await picker.locator('button.clear-button').click();
        await expect(overview).toHaveJSProperty('place', undefined);
        await expect(dataProvider).toHaveJSProperty('place', undefined);
        await expect(map).toHaveAttribute('zoom', '4');
        if (app.removesMarkerOnClear) {
          await expect(marker).toHaveCount(0);
        } else {
          await expect(marker).toHaveJSProperty('position', null);
        }
      });
}
