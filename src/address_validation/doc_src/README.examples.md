#### Taking a next action in an order form

The `suggestValidationAction()` function works well when dealing with order forms or other types of address entry. You should already have a form for accepting input addresses from your customer. This example uses a simple HTML form as a placeholder for your form:

```html
<gmpx-api-loader key="YOUR_API_KEY"></gmpx-api-loader>
<form>
  <input id="address-line-1"/>
  <input id="address-line-2"/>
  <input id="address-line-3"/>
  <input id="region-code"/>
  <input type="submit"/>
</form>
```

Use the Address Validation API to confirm the entered address before submitting the form.

This example is based on the Maps JS library. It shows you how to call the Address Validation JS API then call `suggestValidationAction()` to provide a recommended next action. In your implementation, you can choose to call the Address Validation API once or multiple times:

* If you want to limit API usage, call the Address Validation API once, then trust the user's confirmed or fixed address is valid.
* If you want greater confidence in submitted addresses, call the Address Validation API every time the user attempts to submit the form.

```js
import { APILoader } from '@googlemaps/extended-component-library/api_loader.js';
import { suggestValidationAction } from '@googlemaps/extended-component-library/address_validation.js';

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Make a request to the Address Validation API.
  const {AddressValidation} = await APILoader.importLibrary('addressValidation');
  const request = getRequestFromAddressForm();
  let response;
  try {
    response = await AddressValidation.fetchAddressValidation(request);
  } catch (e) {
    console.error('Failed to validate address', e);
    // Depending on your application, you may want to try again, or accept
    // an unvalidated address if the API call fails.
    return;
  }

  // Take a next action based on the response
  const {suggestedAction} = suggestValidationAction(response);
  if (suggestedAction === 'ACCEPT') {
    // Submit the form, passing `response.address.formattedAddress` as the
    // cleaned address.
  } else if (suggestedAction === 'CONFIRM') {
    // Prompt the user to confirm the entered address before submitting.
  } else if (suggestedAction === 'FIX') {
    // Ask the user to fix their address and try again.
  } else if (suggestedAction === 'ADD_SUBPREMISES') {
    // Ask the user to enter their apartment or unit number before submitting.
  } else {
    throw new Error(`Unexpected validation action ${suggestedAction}`);
  }
});

// Update this function to use the address form inputs on your own page. The
// returned object is an Address Validation API request. Maps JS requires
// `regionCode`, the CLDR region code of the address's country, such as 'US'.
function getRequestFromAddressForm() {
  const addressLines = [
    document.getElementById('address-line-1').value,
    document.getElementById('address-line-2').value,
    document.getElementById('address-line-3').value,
  ].filter(Boolean);
  const regionCode = document.getElementById('region-code').value;
  return {address: {regionCode, addressLines}};
}
```
