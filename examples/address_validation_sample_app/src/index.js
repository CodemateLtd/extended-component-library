/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Import from the same URL as the page's <script> tag. A different URL would
// load the library a second time, which fails when its elements are defined
// again.
import {APILoader, suggestValidationAction} from './extended_component_library.min.js';
import {SAMPLE_RESPONSES} from './sample_responses.js';

const NEXT_STEPS = {
  ACCEPT: 'The address is high quality. Submit the form with the ' +
      'formatted address.',
  CONFIRM: 'The address is high quality, but the API made significant ' +
      'changes to it. Ask the user to confirm the formatted address before ' +
      'submitting.',
  FIX: 'The address is low quality. Ask the user to fix it and validate ' +
      'again.',
  ADD_SUBPREMISES: 'The address should have an apartment or unit number. ' +
      'Ask the user to add one and validate again.',
};

const addressForm = document.getElementById('address-form');
const sampleForm = document.getElementById('sample-form');
const sampleSelect = document.getElementById('sample-response');
const result = document.getElementById('result');

// Counts the results requested so far, so a slow API response doesn't replace
// a result the user asked for after it.
let resultCount = 0;

for (const [index, {label}] of SAMPLE_RESPONSES.entries()) {
  sampleSelect.add(new Option(label, String(index)));
}

addressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const addressLines = [
    document.getElementById('address-line-1').value,
    document.getElementById('address-line-2').value,
  ].filter(Boolean);
  // The Maps JavaScript API requires `regionCode` in the request.
  const regionCode = document.getElementById('region-code').value.toUpperCase();
  const resultNumber = ++resultCount;
  result.textContent = 'Validating…';

  let response;
  try {
    const {AddressValidation} =
        await APILoader.importLibrary('addressValidation');
    response = await AddressValidation.fetchAddressValidation(
        {address: {regionCode, addressLines}});
  } catch (error) {
    // Depending on your application, you may want to try again, or accept an
    // unvalidated address if the API call fails.
    if (resultNumber === resultCount) showError(error);
    return;
  }
  if (resultNumber === resultCount) showSuggestion(response);
});

sampleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  resultCount++;
  showSuggestion(SAMPLE_RESPONSES[Number(sampleSelect.value)].response);
});

function showSuggestion(response) {
  const {suggestedAction} = suggestValidationAction(response);
  result.replaceChildren(
      field('Suggested action', suggestedAction),
      field('Formatted address', response.address?.formattedAddress ?? '—'),
      field('Next step', NEXT_STEPS[suggestedAction]),
  );
}

function showError(error) {
  console.error('Failed to validate address', error);
  result.replaceChildren(
      field('Error', 'The address could not be validated.'),
      field('Details', String(error?.message ?? error)),
  );
}

function field(name, value) {
  const paragraph = document.createElement('p');
  const term = document.createElement('strong');
  term.textContent = `${name}: `;
  paragraph.append(term, value);
  return paragraph;
}
