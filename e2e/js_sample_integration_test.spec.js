/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {expect, test} from '@playwright/test';

test('JS sample clears the selected college from every consumer',
    async ({page}) => {
      await page.setContent(`
        <gmp-map><gmp-advanced-marker></gmp-advanced-marker></gmp-map>
        <gmpx-place-picker></gmpx-place-picker>
        <gmpx-place-overview></gmpx-place-overview>
        <gmpx-place-data-provider></gmpx-place-data-provider>
        <gmpx-overlay-layout></gmpx-overlay-layout>
        <button id="open-button"></button>
        <button id="close-button"></button>
      `);
      await page.addScriptTag({path: 'examples/js_sample_app/src/index.js'});

      const state = await page.evaluate(() => {
        const picker = document.querySelector('gmpx-place-picker');
        const map = document.querySelector('gmp-map');
        const marker = document.querySelector('gmp-advanced-marker');
        const overview = document.querySelector('gmpx-place-overview');
        const dataProvider = document.querySelector('gmpx-place-data-provider');
        const college = {location: {lat: 42.3601, lng: -71.0942}};

        picker.value = college;
        picker.dispatchEvent(new Event('gmpx-placechange'));
        const selected = {
          overview: overview.place === college,
          dataProvider: dataProvider.place === college,
          center: map.center === college.location,
          marker: marker.position === college.location,
          zoom: map.zoom,
        };

        picker.value = undefined;
        picker.dispatchEvent(new Event('gmpx-placechange'));
        return {
          selected,
          cleared: {
            overview: overview.place == null,
            dataProvider: dataProvider.place == null,
            center: map.center,
            marker: marker.position,
            zoom: map.zoom,
          },
        };
      });

      expect(state).toEqual({
        selected: {
          overview: true,
          dataProvider: true,
          center: true,
          marker: true,
          zoom: 16,
        },
        cleared: {
          overview: true,
          dataProvider: true,
          center: {lat: 45, lng: -98},
          marker: undefined,
          zoom: 4,
        },
      });
    });
