/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import '@googlemaps/extended-component-library/place_building_blocks/place_directions_button.js';
import '@googlemaps/extended-component-library/api_loader.js';
import '@googlemaps/extended-component-library/split_layout.js';
import '@googlemaps/extended-component-library/overlay_layout.js';
import '@googlemaps/extended-component-library/icon_button.js';
import '@googlemaps/extended-component-library/place_building_blocks/place_directions_button.js';
import '@googlemaps/extended-component-library/place_building_blocks/place_data_provider.js';
import '@googlemaps/extended-component-library/place_picker.js';
import '@googlemaps/extended-component-library/place_overview.js';

import {Component, ElementRef, OnDestroy, signal, ViewChild} from '@angular/core';
import type {OverlayLayout} from '@googlemaps/extended-component-library/overlay_layout.js';
import type {PlacePicker} from '@googlemaps/extended-component-library/place_picker.js';

const DEFAULT_CENTER = {
  lat: 45,
  lng: -98
};
const DEFAULT_ZOOM = 4;
const DEFAULT_ZOOM_WITH_LOCATION = 16;
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

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  readonly mapsApiKey = import.meta.env.NG_APP_MAPS_API_KEY;

  college?: google.maps.places.Place;
  readonly status =
      signal(this.mapsApiKey ? STATUS.loading : STATUS.missingKey);

  @ViewChild('overlay') overlay!: ElementRef<OverlayLayout>;

  constructor() {
    // The Maps JavaScript API calls this when it rejects the API key:
    // https://developers.google.com/maps/documentation/javascript/events#auth-errors
    window.gm_authFailure = () => {
      this.status.set(STATUS.keyRejected);
    };
  }

  ngOnDestroy() {
    delete window.gm_authFailure;
  }

  get mapCenter() {
    return this.college?.location ?? DEFAULT_CENTER;
  }

  get mapZoom() {
    return this.college ? DEFAULT_ZOOM_WITH_LOCATION : DEFAULT_ZOOM;
  }

  selectCollege(e: Event) {
    this.college = (e.target as PlacePicker)?.value ?? undefined;
    this.clearRequestError();
  }

  clearLoadingStatus() {
    if (this.status() === STATUS.loading) this.status.set('');
  }

  showLoadFailure() {
    this.status.set(STATUS.loadFailed);
  }

  showSearchFailure() {
    this.showRequestError(STATUS.searchFailed);
  }

  showDetailsFailure() {
    this.showRequestError(STATUS.detailsFailed);
  }

  /**
   * Shows a request error, unless the page already reports that Google Maps
   * can't be used at all.
   */
  private showRequestError(message: string) {
    if (!LASTING_STATUSES.includes(this.status())) {
      this.status.set(message);
    }
  }

  /** Clears a request error once the user selects or clears a place. */
  private clearRequestError() {
    if (REQUEST_ERRORS.includes(this.status())) {
      this.status.set('');
    }
  }

  showReviews() {
    this.overlay.nativeElement.showOverlay();
  }

  hideReviews() {
    this.overlay.nativeElement.hideOverlay();
  }
}
