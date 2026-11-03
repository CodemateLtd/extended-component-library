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
const loader = document.querySelector('gmpx-api-loader');
const statusLine = document.getElementById('status');
const map = document.querySelector('gmp-map');
const picker = document.querySelector('gmpx-place-picker');
const overview = document.querySelector('gmpx-place-overview');
const marker = document.querySelector('gmp-advanced-marker');
const overlay = document.querySelector('gmpx-overlay-layout');
const dataProvider = document.querySelector('gmpx-place-data-provider');
const openButton = document.getElementById('open-button');
const closeButton = document.getElementById('close-button');

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
