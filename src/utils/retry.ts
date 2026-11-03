/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** The maximum number of times one request is attempted, in total. */
const MAX_ATTEMPTS = 3;

/**
 * Upper bound of the random delay before the first retry, in milliseconds.
 * 100ms is the initial delay in the exponential backoff that the Routes API
 * web service documentation recommends.
 */
const BASE_DELAY_MS = 100;

/**
 * Makes the request from `makeRequest` and returns its result, retrying with
 * a fresh request while the attempt fails with an error that `shouldRetry`
 * accepts, up to three attempts in total. The last failure is rethrown.
 *
 * The delay before retry N is drawn at random from [0, 100ms * 2^(N-1)) —
 * exponential backoff with full jitter, so that clients that fail together
 * don't retry in step.
 *
 * Retries are not cancellable: a request already sent to the Maps JavaScript
 * API cannot be aborted, and the returned promise may be shared by several
 * callers through a request cache, so one caller could not cancel it for the
 * others. The attempts run out within roughly 300ms.
 */
export async function requestWithRetries<T, ErrorType>(
    makeRequest: () => Promise<T>,
    shouldRetry: (error: ErrorType) => boolean): Promise<T> {
  for (let attempt = 1;; attempt++) {
    try {
      return await makeRequest();
    } catch (error: unknown) {
      if (attempt >= MAX_ATTEMPTS || !shouldRetry(error as ErrorType)) {
        throw error;
      }
    }
    await sleep(Math.random() * BASE_DELAY_MS * 2 ** (attempt - 1));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
