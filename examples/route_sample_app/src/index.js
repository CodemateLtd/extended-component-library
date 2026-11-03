/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const form = document.getElementById('route-form');
const errorMessage = document.getElementById('error-message');
const overview = document.querySelector('gmpx-route-overview');
const dataProvider = document.querySelector('gmpx-route-data-provider');
const routeElements = [overview, dataProvider];
const originMarker =
    document.querySelector('gmpx-route-marker[waypoint="origin"]');
const destinationMarker =
    document.querySelector('gmpx-route-marker[waypoint="destination"]');

function showRoute() {
  const origin = form.elements.origin.value.trim();
  const destination = form.elements.destination.value.trim();
  // An unchanged request doesn't fetch the route again, so keep any error
  // message from the last attempt.
  if (origin === dataProvider.originAddress &&
      destination === dataProvider.destinationAddress) {
    return;
  }
  errorMessage.hidden = true;
  for (const element of routeElements) {
    element.originAddress = origin;
    element.destinationAddress = destination;
  }
  originMarker.title = origin;
  destinationMarker.title = destination;
}

function showRequestError(event) {
  errorMessage.textContent = `Couldn't get a route: ${event.error.message}`;
  errorMessage.hidden = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  showRoute();
});
for (const element of routeElements) {
  element.addEventListener('gmpx-requesterror', showRequestError);
}
showRoute();
