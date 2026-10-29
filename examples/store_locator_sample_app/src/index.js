/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const locator = document.querySelector('gmpx-store-locator');
const errorBanner = document.getElementById('error-banner');
const dismissButton = document.getElementById('dismiss-button');

locator.listings = [
  {
    title: 'Acadia National Park',
    addressLines: ['Maine', 'USA'],
    position: {lat: 44.3386, lng: -68.2733},
    placeId: 'ChIJJSmiDrKjrkwRhFVV_A4i32I',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/acad/'}],
  },
  {
    title: 'Bryce Canyon National Park',
    addressLines: ['Utah', 'USA'],
    position: {lat: 37.6404, lng: -112.1696},
    placeId: 'ChIJLevDAsZrNYcRBm2svvvY6Ws',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/brca/'}],
  },
  {
    title: 'Everglades National Park',
    addressLines: ['Florida', 'USA'],
    position: {lat: 25.3952, lng: -80.5831},
    placeId: 'ChIJ2wVsejCo0IgRlzEvdlY-4A8',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/ever/'}],
  },
  {
    title: 'Great Smoky Mountains National Park',
    addressLines: ['Tennessee and North Carolina', 'USA'],
    position: {lat: 35.6118, lng: -83.4895},
    placeId: 'ChIJFRj7iGuYXogRYSR1p8Fvkjw',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/grsm/'}],
  },
  {
    title: 'Yellowstone National Park',
    addressLines: ['Wyoming, Montana and Idaho', 'USA'],
    position: {lat: 44.4280, lng: -110.5885},
    placeId: 'ChIJVVVVVVXlUVMRu-GPNDD5qKw',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/yell/'}],
  },
  {
    title: 'Yosemite National Park',
    addressLines: ['California', 'USA'],
    position: {lat: 37.8651, lng: -119.5383},
    placeId: 'ChIJxeyK9Z3wloAR_gOA7SycJC0',
    actions: [{label: 'Website', defaultUri: 'https://www.nps.gov/yose/'}],
  },
];

// Setting mapOptions replaces the component's defaults, so this repeats them
// and turns off the fullscreen control as well.
locator.mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  maxZoom: 17,
  streetViewControl: false,
};

// The store locator dispatches gmpx-requesterror when a Route Matrix request
// (distances to the listings) or a route request (directions) fails.
locator.addEventListener('gmpx-requesterror', (event) => {
  console.error(event.error);
  errorBanner.hidden = false;
});
dismissButton.addEventListener('click', () => {
  errorBanner.hidden = true;
});
