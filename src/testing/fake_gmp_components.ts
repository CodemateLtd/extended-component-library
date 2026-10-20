/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement} from 'lit';

import {LatLng, LatLngLiteral} from '../utils/googlemaps_types.js';

declare global {
  interface HTMLElementTagNameMap {
    'gmp-map': FakeMapElement;
    'gmp-advanced-marker': FakeAdvancedMarkerElement;
  }
}

/** A fake `google.maps.MapElement` class for testing purposes. */
export class FakeMapElement extends LitElement {
  readonly innerMap = jasmine.createSpyObj<google.maps.Map>(
      'Map', ['addListener', 'fitBounds', 'getBounds', 'panTo', 'setOptions']);

  center: LatLng|LatLngLiteral|null = null;
  mapId: string|null = null;
  zoom: number|null = null;
  headingInteractionDisabled: boolean|null = null;
  internalUsageAttributionIds: Iterable<string>|null = null;
  renderingType: google.maps.RenderingTypeString|null = null;
  tiltInteractionDisabled: boolean|null = null;
}

/**
 * A fake `google.maps.AdvancedMarkerElement` class for testing purposes.
 */
export class FakeAdvancedMarkerElement extends LitElement {
  position?: LatLng|null;
  zIndex?: number|null;
  override title = '';
  map?: google.maps.Map|null;

  innerContent?: Element|null;
  set content(content: Element|null|undefined) {
    // Detach from the DOM as in the real AdvancedMarkerElement
    content?.remove();
    this.innerContent = content;
  }
  get content(): Element|null|undefined {
    return this.innerContent;
  }

  get element(): HTMLElement {
    return this;
  }

  addListener(eventName: string, handler: Function):
      google.maps.MapsEventListener {
    return {
      remove: () => {},
    };
  }
}

/**
 * A fake `google.maps.places.PlaceAutocompleteElement` class for testing
 * purposes. Its text input is reachable through an open shadow root, and its
 * options are plain properties.
 */
export class FakePlaceAutocompleteElement extends HTMLElement {
  includedPrimaryTypes: string[]|null = null;
  includedRegionCodes: string[]|null = null;
  locationBias: google.maps.places.LocationBias|null = null;
  locationRestriction: google.maps.places.LocationRestriction|null = null;
  noClearButton = false;
  noInputIcon = false;
  placeholder: string|null = null;

  readonly input = document.createElement('input');

  constructor(options: google.maps.places.PlaceAutocompleteElementOptions) {
    super();
    this.attachShadow({mode: 'open', delegatesFocus: true}).append(this.input);
    Object.assign(this, options);
  }

  get value(): string {
    return this.input.value;
  }
  set value(value: string|null) {
    this.input.value = value ?? '';
  }
}
