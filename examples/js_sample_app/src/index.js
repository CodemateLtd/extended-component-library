/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const DEFAULT_CENTER = {lat:45, lng:-98};
const STATUS = {
  missingKey: 'No Maps API key is set. Set MAPS_API_KEY and restart the app.',
  loading: 'Loading Google Maps…',
  loadFailed:
      'Couldn\'t load Google Maps. Check your connection and reload the page.',
  keyRejected:
      'Google Maps rejected the API key. See the browser console for details.',
  searchFailed: 'Couldn\'t search for colleges. Try again.',
  detailsFailed: 'Couldn\'t load details for this college. Try again.',
};
/** Messages that stay, since Google Maps can't be used at all. */
const LASTING_STATUSES =
    [STATUS.missingKey, STATUS.loadFailed, STATUS.keyRejected];
const REQUEST_ERRORS = [STATUS.searchFailed, STATUS.detailsFailed];

/**
 * Returns the element matching `selector`, or throws a setup error naming it
 * if index.html doesn't have one.
 */
function requireElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(
        `index.js needs an element matching "${selector}" in index.html.`);
  }
  return element;
}

const loader = requireElement('gmpx-api-loader');
const statusLine = requireElement('#status');
const map = requireElement('gmp-map');
const picker = requireElement('gmpx-place-picker');
const overview = requireElement('gmpx-place-overview');
const marker = requireElement('gmp-advanced-marker');
const overlay = requireElement('gmpx-overlay-layout');
const dataProvider = requireElement('gmpx-place-data-provider');
const openButton = requireElement('#open-button');
const closeButton = requireElement('#close-button');

/**
 * Shows a request error, unless the page already reports that Google Maps
 * can't be used at all.
 */
function showRequestError(message) {
  if (!LASTING_STATUSES.includes(statusLine.textContent)) {
    statusLine.textContent = message;
  }
}

/** Clears a request error once the user selects or clears a place. */
function clearRequestError() {
  if (REQUEST_ERRORS.includes(statusLine.textContent)) {
    statusLine.textContent = '';
  }
}

statusLine.textContent =
    loader.getAttribute('key') ? STATUS.loading : STATUS.missingKey;

loader.addEventListener('gmpx-load', () => {
  if (statusLine.textContent === STATUS.loading) {
    statusLine.textContent = '';
  }
});
loader.addEventListener('gmpx-requesterror', () => {
  statusLine.textContent = STATUS.loadFailed;
});
// The Maps JavaScript API calls this when it rejects the API key:
// https://developers.google.com/maps/documentation/javascript/events#auth-errors
window.gm_authFailure = () => {
  statusLine.textContent = STATUS.keyRejected;
};
picker.addEventListener('gmpx-requesterror', () => {
  showRequestError(STATUS.searchFailed);
});
overview.addEventListener('gmpx-requesterror', () => {
  showRequestError(STATUS.detailsFailed);
});
dataProvider.addEventListener('gmpx-requesterror', () => {
  showRequestError(STATUS.detailsFailed);
});

picker.addEventListener('gmpx-placechange', () => {
  clearRequestError();
  overview.place = picker.value;
  dataProvider.place = picker.value;
  if (picker.value == null) {
    map.center = DEFAULT_CENTER;
    marker.position = undefined;
    map.zoom = 4;
  } else {
    map.center = picker.value.location;
    marker.position = picker.value.location;
    map.zoom = 16;
  }
});
openButton.addEventListener('click', () => {overlay.showOverlay();});
closeButton.addEventListener('click', () => {overlay.hideOverlay();});
