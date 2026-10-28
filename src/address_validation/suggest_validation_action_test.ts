/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import 'jasmine'; (google3-only)

import {Address, AddressComponent, AddressValidation, mapsJsData, Verdict} from '../utils/googlemaps_types.js';

import {SuggestedAction, suggestValidationAction} from './suggest_validation_action.js';

const GOOD_VERDICT = {
  inputGranularity: 'PREMISE',
  validationGranularity: 'PREMISE',
  geocodeGranularity: 'PREMISE',
  addressComplete: true,
  hasUnconfirmedComponents: false,
  hasInferredComponents: false,
  hasReplacedComponents: false,
  possibleNextAction: null,
} satisfies Verdict;

const LOCALITY_COMPONENT = {
  componentName: 'Mountain View',
  componentNameLanguageCode: 'en',
  componentType: 'locality',
  confirmationLevel: null,
  inferred: false,
  spellCorrected: false,
  replaced: false,
  unexpected: false
} satisfies AddressComponent;

function makeFakeValidationResponse(
    address: Partial<Address>|null, verdict: Verdict|null): AddressValidation {
  return mapsJsData({
    verdict,
    address: address === null ? null : mapsJsData({
      formattedAddress: null,
      postalAddress: null,
      components: [],
      missingComponentTypes: [],
      unconfirmedComponentTypes: [],
      unresolvedTokens: [],
      ...address
    }),
    geocode: null,
    metadata: null,
    responseId: '',
    uspsData: null,
  });
}

describe('SuggestValidationAction', () => {
  it('returns FIX when an address is missing', () => {
    const suggestion =
        suggestValidationAction(makeFakeValidationResponse(null, GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
  });

  it('returns FIX when verdict is missing', () => {
    const suggestion =
        suggestValidationAction(makeFakeValidationResponse({}, null));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
  });

  it('returns FIX when an address is missing a non-subpremise component',
     () => {
       const suggestion = suggestValidationAction(makeFakeValidationResponse(
           {missingComponentTypes: ['locality']}, GOOD_VERDICT));
       expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
     });

  it('returns FIX when the validation granularity is OTHER', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {}, {...GOOD_VERDICT, validationGranularity: 'OTHER'}));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
  });

  it('returns FIX when there is a suspicious component', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {
          components: [{
            ...LOCALITY_COMPONENT,
            confirmationLevel: 'UNCONFIRMED_AND_SUSPICIOUS'
          }]
        },
        GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
  });

  it('returns FIX when there is an unresolved token', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {unresolvedTokens: ['foobar']}, GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.FIX);
  });

  it('returns CONFIRM when there is a non-minor inferred component', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {
          components: [{
            ...LOCALITY_COMPONENT,
            inferred: true,
          }]
        },
        GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.CONFIRM);
  });

  it('returns ACCEPT when only a minor component is inferred', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {
          components: [{
            ...LOCALITY_COMPONENT,
            componentType: 'postal_code',
            inferred: true,
          }]
        },
        GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.ACCEPT);
  });

  it('returns CONFIRM when there is a replaced component', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {}, {...GOOD_VERDICT, hasReplacedComponents: true}));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.CONFIRM);
  });

  it('returns ADD_SUBPREMISES when a US address doesn\'t have one', () => {
    const suggestion = suggestValidationAction(makeFakeValidationResponse(
        {
          missingComponentTypes: ['subpremise'],
          postalAddress: mapsJsData({
            addressLines: [],
            administrativeArea: null,
            languageCode: null,
            locality: null,
            organization: null,
            postalCode: null,
            recipients: [],
            regionCode: 'US',
            sortingCode: null,
            sublocality: null,
          })
        },
        GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.ADD_SUBPREMISES);
  });

  it('returns ACCEPT for a complete verdict without any issues', () => {
    const suggestion =
        suggestValidationAction(makeFakeValidationResponse({}, GOOD_VERDICT));
    expect(suggestion.suggestedAction).toBe(SuggestedAction.ACCEPT);
  });
});
