/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile} from 'node:fs/promises';

const BUNDLE_PATH = '/extended_component_library.min.js';

export default {
  nodeResolve: true,
  rootDir: 'src/',
  plugins: [{
    name: 'local-library',
    async serve(context) {
      if (context.path === BUNDLE_PATH) {
        const body = await readFile(
            new URL('../../dist/index.min.js', import.meta.url), 'utf8');
        return {body, type: 'js'};
      }
    },
    transform(context) {
      if (context.path === '/' || context.path === '/index.html') {
        return {
          body: context.body.replace(
              'key="YOUR_API_KEY"', `key="${process.env.MAPS_API_KEY ?? ''}"`),
        };
      }
    },
  }],
};
