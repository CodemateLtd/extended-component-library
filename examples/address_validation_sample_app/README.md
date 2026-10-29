# Address Validation Sample App

This directory contains a simple JavaScript app that validates an address with
Address Validation in the Maps JavaScript API, then passes the response to
`suggestValidationAction()` from the Extended Component Library to get a
suggested next action: `ACCEPT`, `CONFIRM`, `FIX` or `ADD_SUBPREMISES`.

The app has two parts:

* A form that sends the entered address to the API with
  `AddressValidation.fetchAddressValidation()`. The request must include a
  region code, such as `US`.
* A list of sample responses, one for each action, that skips the API call.
  Use these to see every action, including ones that are hard to get from a
  real address.

Before you start, you need an API key from a Google Cloud project with billing
enabled. The project needs the Maps JavaScript API and the Address Validation
API enabled. If you restrict the key, add the website `http://localhost:8006`
and select those two APIs. To create and restrict a key, see
[Getting your API key](../../README.md#getting-your-api-key).

To view the app from a local dev server, first clone this library from GitHub,
then run the following command from the repository's root directory:

```shell
MAPS_API_KEY="[REPLACE_WITH_YOUR_API_KEY]" npm run example:address_validation_sample_app
```

Note that this command will build the library locally to incorporate its latest
changes, including those not yet released on npm.

See the [`suggestValidationAction()` reference](../../src/address_validation/README.md)
for how the function decides on an action.
