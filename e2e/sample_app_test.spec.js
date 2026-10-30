/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, test} from '@playwright/test';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';

import {openSampleApp, SAMPLE_APP_CONFIGS, searchCollege} from './sample_apps.js';

test('JS sample serves the built bundle without rewriting source',
    async ({request}) => {
      const page = await request.get('http://localhost:8002/');
      const bundle = await request.get(
          'http://localhost:8002/extended_component_library.min.js');
      const html = await page.text();

      expect(page.ok()).toBe(true);
      expect(bundle.ok()).toBe(true);
      expect(html).toContain('src="./extended_component_library.min.js"');
      expect(html).not.toContain('unpkg.com');
      expect(html).not.toContain('key="YOUR_API_KEY"');
      expect(await bundle.body()).toEqual(
          await readFile(new URL('../dist/index.min.js', import.meta.url)));
      expect(await readFile(new URL(
          '../examples/js_sample_app/src/index.html', import.meta.url), 'utf8'))
          .toContain('key="YOUR_API_KEY"');
      expect(existsSync(new URL(
          '../examples/js_sample_app/src/extended_component_library.min.js',
          import.meta.url))).toBe(false);
    });

for (const app of SAMPLE_APP_CONFIGS) {
  test(
      `${app.title} locates a college on the map and displays its info`,
      async ({page}) => {
        await openSampleApp(page, app);

        const map = page.locator('gmp-map');
        const marker = page.locator('gmp-advanced-marker');
        await expect(map).toHaveAttribute('zoom', '4');

        await searchCollege(page, 'mit');

        const overview = page.locator('gmpx-place-overview');
        await expect(overview).toContainText(
            'Massachusetts Institute of Technology');
        await expect(map).toHaveAttribute('zoom', '16');
        await expect(marker).toHaveCount(1);

        const reviews = page.locator('gmpx-place-reviews');
        await page.getByText('See Reviews').click();
        await expect(reviews).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(reviews).not.toBeVisible();

        const popupPromise = page.waitForEvent('popup');
        await page.getByText('Directions').click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        await expect(popup.url()).toContain('https://www.google.com/maps/dir');
        await expect(popup.url()).toContain('Cambridge');
      });
}
