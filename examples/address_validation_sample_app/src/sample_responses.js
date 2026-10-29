/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Plain objects shaped like the Maps JavaScript API `AddressValidation` class,
// one for each action `suggestValidationAction()` can return. They carry a
// subset of the fields a live response has. The addresses are illustrative,
// not real API output.

function makeComponent(componentType, componentName, overrides = {}) {
  return {
    componentType,
    componentName,
    confirmationLevel: 'CONFIRMED',
    inferred: false,
    replaced: false,
    spellCorrected: false,
    unexpected: false,
    ...overrides,
  };
}

function makeResponse({
  formattedAddress,
  components,
  missingComponentTypes = [],
  validationGranularity = 'PREMISE',
}) {
  return {
    address: {
      formattedAddress,
      postalAddress: {regionCode: 'US'},
      components,
      missingComponentTypes,
      unresolvedTokens: [],
    },
    verdict: {
      validationGranularity,
      hasInferredComponents: components.some(c => c.inferred),
      hasReplacedComponents: false,
    },
  };
}

export const SAMPLE_RESPONSES = [
  {
    label: 'ACCEPT: a complete, confirmed address',
    response: makeResponse({
      formattedAddress:
          '1600 Amphitheatre Parkway, Mountain View, CA 94043-1351, USA',
      components: [
        makeComponent('street_number', '1600'),
        makeComponent('route', 'Amphitheatre Parkway'),
        makeComponent('locality', 'Mountain View'),
        makeComponent('administrative_area_level_1', 'CA'),
        makeComponent('postal_code', '94043'),
        makeComponent('country', 'USA'),
      ],
    }),
  },
  {
    label: 'CONFIRM: the API inferred the city',
    response: makeResponse({
      formattedAddress:
          '1600 Amphitheatre Parkway, Mountain View, CA 94043-1351, USA',
      components: [
        makeComponent('street_number', '1600'),
        makeComponent('route', 'Amphitheatre Parkway'),
        makeComponent('locality', 'Mountain View', {inferred: true}),
        makeComponent('administrative_area_level_1', 'CA'),
        makeComponent('postal_code', '94043'),
        makeComponent('country', 'USA'),
      ],
    }),
  },
  {
    label: 'FIX: the street could not be found',
    response: makeResponse({
      formattedAddress: 'Mountain View, CA, USA',
      components: [
        makeComponent('route', 'Amphitheetre Pkwy', {
          confirmationLevel: 'UNCONFIRMED_AND_SUSPICIOUS',
        }),
        makeComponent('locality', 'Mountain View'),
        makeComponent('administrative_area_level_1', 'CA'),
        makeComponent('country', 'USA'),
      ],
      missingComponentTypes: ['street_number'],
      validationGranularity: 'OTHER',
    }),
  },
  {
    label: 'ADD_SUBPREMISES: an apartment building without a unit number',
    response: makeResponse({
      formattedAddress: '123 Main Street, Springfield, IL 62701, USA',
      components: [
        makeComponent('street_number', '123'),
        makeComponent('route', 'Main Street'),
        makeComponent('locality', 'Springfield'),
        makeComponent('administrative_area_level_1', 'IL'),
        makeComponent('postal_code', '62701'),
        makeComponent('country', 'USA'),
      ],
      missingComponentTypes: ['subpremise'],
    }),
  },
];
