/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** Flushes pending microtasks so promise chains can advance. */
export async function flushMicrotasks() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

/**
 * Advances the mock clock past all backoff delays of the bounded automatic
 * request retries, flushing microtasks in between so each retry attempt can
 * schedule the next delay.
 */
export async function settleRetries() {
  for (let i = 0; i < 4; i++) {
    await flushMicrotasks();
    jasmine.clock().tick(400);
  }
  await flushMicrotasks();
}
