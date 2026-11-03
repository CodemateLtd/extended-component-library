/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)

import {isAutoRetriableRpcError, isRetriableRpcError} from './rpc_status.js';

function makeError(code: string): google.maps.MapsRequestError {
  return {code, name: 'MapsRequestError'} as google.maps.MapsRequestError;
}

describe('isRetriableRpcError', () => {
  for (const code of ['RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'UNKNOWN']) {
    it(`returns true for transient status ${code}`, () => {
      expect(isRetriableRpcError(makeError(code))).toBeTrue();
    });
  }

  for (const code of ['INVALID_ARGUMENT', 'PERMISSION_DENIED', 'NOT_FOUND']) {
    it(`returns false for non-transient status ${code}`, () => {
      expect(isRetriableRpcError(makeError(code))).toBeFalse();
    });
  }
});

describe('isAutoRetriableRpcError', () => {
  for (const code of ['UNAVAILABLE', 'UNKNOWN']) {
    it(`returns true for transient status ${code}`, () => {
      expect(isAutoRetriableRpcError(makeError(code))).toBeTrue();
    });
  }

  // RESOURCE_EXHAUSTED failures are evicted from the request cache but never
  // retried automatically, since that could multiply the quota usage that
  // made the request fail.
  for (const code
           of ['RESOURCE_EXHAUSTED', 'INVALID_ARGUMENT', 'PERMISSION_DENIED',
               'NOT_FOUND']) {
    it(`returns false for status ${code}`, () => {
      expect(isAutoRetriableRpcError(makeError(code))).toBeFalse();
    });
  }
});
