/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as GMPX from '@googlemaps/extended-component-library/react';
import React from 'react';

import './App.css';
import {CollegePicker} from './CollegePicker';

const API_KEY = import.meta.env.VITE_MAPS_API_KEY;
const DEFAULT_CENTER = '45,-98';
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
const LASTING_STATUSES = [
  STATUS.missingKey,
  STATUS.loadFailed,
  STATUS.keyRejected,
];
const REQUEST_ERRORS = [STATUS.searchFailed, STATUS.detailsFailed];

/**
 * Sample app that helps users locate a college on the map, with place info such
 * as ratings, photos, and reviews displayed on the side.
 */
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      college: undefined,
      status: API_KEY ? STATUS.loading : STATUS.missingKey,
    };
    this.overlayLayoutRef = React.createRef();
  }

  componentDidMount() {
    // The Maps JavaScript API calls this when it rejects the API key:
    // https://developers.google.com/maps/documentation/javascript/events#auth-errors
    window.gm_authFailure = () => {
      this.setState({status: STATUS.keyRejected});
    };
  }

  componentWillUnmount() {
    delete window.gm_authFailure;
  }

  clearLoadingStatus() {
    this.setState(({status}) =>
      status === STATUS.loading ? {status: ''} : null
    );
  }

  /**
   * Shows a request error, unless the page already reports that Google Maps
   * can't be used at all.
   */
  showRequestError(message) {
    this.setState(({status}) =>
      LASTING_STATUSES.includes(status) ? null : {status: message}
    );
  }

  /** Selects a college, clearing any request error. */
  selectCollege(college) {
    this.setState(({status}) =>
      REQUEST_ERRORS.includes(status) ? {college, status: ''} : {college}
    );
  }

  render() {
    // Converts the location LatLng object to a string in "lat,lng" format.
    // Note that (as of React 18) Web Components in JSX accept data only as
    // string attributes and not as properties.
    const location = this.state.college?.location?.toString().slice(1, -1);

    return (
      <div className="App">
        <GMPX.APILoader
          apiKey={API_KEY}
          onLoad={() => this.clearLoadingStatus()}
          onRequestError={() => this.setState({status: STATUS.loadFailed})}
        />
        <GMPX.SplitLayout rowReverse rowLayoutMinWidth="700">
          <GMPX.OverlayLayout ref={this.overlayLayoutRef} slot="fixed">
            <div className="MainContainer" slot="main">
              <p className="Status" role="status">
                {this.state.status}
              </p>
              <CollegePicker
                className="CollegePicker"
                forMap="gmap"
                onCollegeChange={(college) => this.selectCollege(college)}
                onRequestError={() =>
                  this.showRequestError(STATUS.searchFailed)
                }
              />
              <GMPX.PlaceOverview
                size="large"
                place={this.state.college}
                googleLogoAlreadyDisplayed
                onRequestError={() =>
                  this.showRequestError(STATUS.detailsFailed)
                }
              >
                <GMPX.IconButton
                  slot="action"
                  variant="filled"
                  onClick={() => this.overlayLayoutRef.current?.showOverlay()}
                >
                  See Reviews
                </GMPX.IconButton>
                <GMPX.PlaceDirectionsButton slot="action" variant="filled">
                  Directions
                </GMPX.PlaceDirectionsButton>
              </GMPX.PlaceOverview>
            </div>
            <div slot="overlay">
              <GMPX.IconButton
                autofocus
                className="CloseButton"
                onClick={() => this.overlayLayoutRef.current?.hideOverlay()}
              >
                Close
              </GMPX.IconButton>
              <GMPX.PlaceDataProvider
                place={this.state.college}
                onRequestError={() =>
                  this.showRequestError(STATUS.detailsFailed)
                }
              >
                <GMPX.PlaceReviews />
              </GMPX.PlaceDataProvider>
            </div>
          </GMPX.OverlayLayout>
          <gmp-map
            id="gmap"
            slot="main"
            map-id="DEMO_MAP_ID"
            center={location ?? DEFAULT_CENTER}
            zoom={location ? DEFAULT_ZOOM_WITH_LOCATION : DEFAULT_ZOOM}
          >
            {location && (
              <gmp-advanced-marker position={location}></gmp-advanced-marker>
            )}
          </gmp-map>
        </GMPX.SplitLayout>
      </div>
    );
  }
}
