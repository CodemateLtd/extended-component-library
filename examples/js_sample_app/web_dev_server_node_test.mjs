/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {access, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {after, test} from 'node:test';

const PORT = 9006;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_KEY = 'TEST_API_KEY';
const server = spawn('./node_modules/.bin/wds', ['--port', String(PORT)], {
  cwd: fileURLToPath(new URL('.', import.meta.url)),
  env: {...process.env, MAPS_API_KEY: TEST_KEY},
  stdio: 'ignore',
});

after(() => server.kill());

async function response(path) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      return await fetch(`${BASE_URL}${path}`);
    } catch {
      if (server.exitCode !== null) {
        throw new Error('Web Dev Server exited');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('Web Dev Server did not start');
}

test('serves the local bundle and inserts the key without editing HTML', async () => {
  const source = await readFile(new URL('src/index.html', import.meta.url), 'utf8');
  const page = await response('/');
  const index = await response('/index.html');
  const bundle = await response('/extended_component_library.min.js');

  assert.equal(page.status, 200);
  assert.equal(index.status, 200);
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get('content-type'), /javascript/);
  assert.equal(await bundle.text(), await readFile(
      new URL('../../dist/index.min.js', import.meta.url), 'utf8'));

  for (const html of [await page.text(), await index.text()]) {
    assert.match(html, /src="\.\/extended_component_library\.min\.js"/);
    assert.match(html, /key="TEST_API_KEY"/);
    assert.doesNotMatch(html, /unpkg\.com|YOUR_API_KEY/);
  }
  assert.match(source, /key="YOUR_API_KEY"/);
  assert.equal(await readFile(new URL('src/index.html', import.meta.url), 'utf8'), source);
  await assert.rejects(
      access(new URL('src/extended_component_library.min.js', import.meta.url)),
      {code: 'ENOENT'});
});
