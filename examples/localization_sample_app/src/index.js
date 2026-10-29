/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Import from the same URL as the page's <script> so the library loads once.
import {setStringLiterals} from './extended_component_library.min.js';

/** Spanish names for some of the place types the components display. */
const PLACE_TYPES = new Map([
  ['art_gallery', 'Galería de arte'],
  ['museum', 'Museo'],
  ['park', 'Parque'],
  ['restaurant', 'Restaurante'],
  ['tourist_attraction', 'Lugar de interés turístico'],
]);

// The library's own text. See src/base/strings.ts for every key; the
// LOCATOR_* keys are left out because this page has no Store Locator.
setStringLiterals({
  'PLACE_CLEAR_ARIA_LABEL': 'Borrar',
  'PLACE_CLOSED': 'Cerrado',
  'PLACE_CLOSED_PERMANENTLY': 'Cerrado permanentemente',
  'PLACE_CLOSED_TEMPORARILY': 'Cerrado temporalmente',
  'PLACE_CLOSES': (closingTime) => `Cierra: ${closingTime}`,
  'PLACE_HAS_DELIVERY': 'Entrega a domicilio',
  'PLACE_HAS_DINE_IN': 'Consumo en el local',
  'PLACE_HAS_TAKEOUT': 'Para llevar',
  'PLACE_NO_DELIVERY': 'Sin entrega a domicilio',
  'PLACE_NO_DINE_IN': 'Sin consumo en el local',
  'PLACE_NO_TAKEOUT': 'Sin servicio para llevar',
  'PLACE_OPEN_ALWAYS': 'Abierto 24 horas',
  'PLACE_OPEN_NOW': 'Abierto ahora',
  'PLACE_OPENING_HOURS_DEFAULT_SUMMARY': 'Ver horario',
  'PLACE_OPENING_HOURS_ARIA_LABEL': 'Horario semanal',
  'PLACE_OPENS': (openingTime) => `Abre: ${openingTime}`,
  'PLACE_OPERATIONAL': 'En funcionamiento',
  'PLACE_PHOTO_ALT': (placeName) => `Foto de ${placeName || 'un lugar'}`,
  'PLACE_PHOTO_ATTRIBUTION_PREFIX': 'Foto de',
  'PLACE_PHOTO_BACK_ARIA_LABEL': 'Atrás',
  'PLACE_PHOTO_NEXT_ARIA_LABEL': 'Siguiente',
  'PLACE_PHOTO_PREV_ARIA_LABEL': 'Anterior',
  'PLACE_PHOTO_TILE_ARIA_LABEL': (i) => `Abrir foto ${i}`,
  'PLACE_RATING_ARIA_LABEL': (rating) => (rating === 1) ?
      '1 estrella' :
      `${String(rating).replace('.', ',')} estrellas`,
  'PLACE_REVIEWS_AUTHOR_PHOTO_ALT': (author) =>
      `Foto de ${author || 'un autor'}`,
  'PLACE_REVIEWS_MORE': 'Más reseñas',
  'PLACE_REVIEWS_SECTION_CAPTION': 'Más relevantes',
  'PLACE_REVIEWS_SECTION_HEADING': 'Reseñas de usuarios de Google',
  'PLACE_SEARCH_ARIA_LABEL': 'Buscar',
  // Other types are formatted as in the library, such as "City hall".
  'PLACE_TYPE': (placeType) => PLACE_TYPES.get(placeType) ??
      (placeType.charAt(0).toUpperCase() + placeType.slice(1))
          .replace(/_/g, ' '),
});

const picker = document.querySelector('gmpx-place-picker');
const overview = document.querySelector('gmpx-place-overview');
const strictBoundsCheckbox = document.getElementById('strict-bounds');
const errorMessage = document.getElementById('error-message');

picker.addEventListener('gmpx-placechange', () => {
  errorMessage.textContent = '';
  if (picker.value) {
    overview.place = picker.value;
  }
});

// Fired when a request for suggestions, a search or place details fails, for
// example because the API key isn't valid.
picker.addEventListener('gmpx-requesterror', (event) => {
  console.error(event.error);
  errorMessage.textContent =
      'No se ha podido completar la búsqueda. Vuelve a intentarlo más tarde.';
});

// With strict bounds, only places inside the rectangle that encloses the
// location-bias circle are suggested.
function updateStrictBounds() {
  picker.strictBounds = strictBoundsCheckbox.checked;
}
strictBoundsCheckbox.addEventListener('change', updateStrictBounds);
// Browsers can restore the checkbox's state when the page reloads.
updateStrictBounds();
