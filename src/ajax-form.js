const Swal = require('sweetalert2');
const isSANB = require('is-string-and-not-blank');
const qs = require('qs');
const superagent = require('superagent');

const Spinner = require('./spinner');

// Ajax form submission with frisbee
// and sweetalert2 message response
// and built-in support for Stripe Checkout
// eslint-disable-next-line complexity
const ajaxForm = async (ev) => {
  // Prevent default form submission
  ev.preventDefault();

  // Get the form
  const $form = $(ev.currentTarget);

  // Return early if we're using `confirm-prompt` plugin
  // and it has not yet been confirmed
  if (
    ($form.hasClass('confirm-prompt') ||
      $form.data('toggle') === 'confirm-prompt') &&
    !$form.data('confirmed')
  )
    return false;

  // Initialize spinner
  const spinner = new Spinner($);

  // const api = new Frisbee({
  //   baseURI: window.location.origin,
  //   headers: defaultHeaders
  // });

  // TODO: use stripe-checkout lib
  // If the form requires Stripe checkout token
  // then return early and open Stripe checkout
  if ($form.hasClass('stripe-checkout')) {
    if (!window.StripeCheckout)
      throw new Error('StripeCheckout global missing');

    // Lookup email input for later
    const $email = $form.find('input[name="stripe_email"]');

    // If there is already a token then continue
    const $token = $form.find('input[name="stripe_token"]');

    if ($token.length === 0) throw new Error('Stripe token field missing');

    if ($token.val() === '') {
      // Fetch token for the user
      const handler = window.StripeCheckout.configure({
        key: window.STRIPE_PUBLISHABLE_KEY,
        image: window.STRIPE_CHECKOUT_IMAGE_URL,
        locale: window.LOCALE || 'auto',
        token: (token) => {
          // You can access the token ID with `token.id`.
          // get the token ID to your server-side code for use
          $token.val(token.id);
          // Also included is `token.email`
          // which we append to the form if
          // there is an `input[name=email]`
          if ($email.length > 0) $email.val(token.email);
          ajaxForm.call(this, ev);
        }
      });

      handler.open({
        allowRememberMe: false,
        ...$form.data()
      });

      $(window).on('popstate', () => handler.close());

      return;
    }
  }

  // Show the spinner
  spinner.show();

  // Disable submit button so we can't resubmit the form
  const $btns = $form.find('input[type="submit"], button[type="submit"]');
  $btns.prop('disabled', true).addClass('disabled');

  // Determine the path we're sending the request to
  let action = $form.attr('action');

  // If the action is missing a starting forward slash then append it
  if (action.indexOf('/') !== 0) action = `/${action}`;

  // Determine the method of the HTTP request
  let method = $form.attr('method');

  // Default to GET request
  if (!method) method = 'GET';

  // Take into account method override middleware
  if (method === 'POST' && $form.find('input[name="_method"]').length > 0)
    method = $form.find('input[name="_method"]').val();

  // Consider that DELETE needs to be mapped to DEL since fetch uses `.del`
  if (method === 'DELETE') method = 'DEL';

  try {
    const headers = {
      'X-CSRF-Token': window._csrf,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    };

    // If the form contains a file input, then we need to use FormData
    // otherwise we can just use querystring parsing to assemble body
    let body = {};

    if ($form.find('input[type="file"]').length > 0) {
      body = new FormData(this);
      // delete _csrf and _method from the body
      // since they are defined in headers and http method
      body.delete('_csrf');
      body.delete('_method');
      // remove content-type header so boundary is added for multipart forms
      // http://stackoverflow.com/a/35799817
      headers['Content-Type'] = undefined;
      delete headers['Content-Type'];
    } else {
      body = qs.parse($form.serialize());
      // delete _csrf and _method from the body
      // since they are defined in headers and http method
      delete body._csrf;
      delete body._method;
    }

    // TODO: this does not support retries/timeout yet
    // Send the request
    const response = await superagent[method.toLowerCase()](action)
      .set(headers)
      .ok(() => true) // override so we can parse it ourselves
      .send(body);

    // taken from Frisbee
    // attempt to use better and human-friendly error messages
    if (!response.ok) {
      response.err = new Error(
        response.statusText || response.text || 'Unsuccessful HTTP response'
      );
      if (
        typeof response.body === 'object' &&
        response.body !== null &&
        typeof response.body.message === 'string'
      ) {
        response.err = new Error(response.body.message);
      } else if (
        !Array.isArray(response.body) &&
        typeof response.body === 'object' &&
        response.body !== null &&
        // attempt to utilize Stripe-inspired error messages
        typeof response.body.error === 'object'
      ) {
        if (response.body.error.message)
          response.err = new Error(response.body.error.message);
        if (response.body.error.stack)
          response.err.stack = response.body.error.stack;
        if (response.body.error.code)
          response.err.code = response.body.error.code;
        if (response.body.error.param)
          response.err.param = response.body.error.param;
      }
    }

    // Check if any errors occurred
    if (response.err) throw response.err;

    // Either display a success message, redirect user, or reload page
    if (typeof response.body !== 'object' || response.body === null) {
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(
        window._types.error,
        'Invalid response, please try again',
        'error'
      );
    } else if (isSANB(response.body.redirectTo)) {
      if (
        (typeof response.body.autoRedirect === 'boolean' &&
          response.body.autoRedirect) ||
        (!isSANB(response.body.message) &&
          typeof response.body.swal !== 'object')
      ) {
        // Reset the form
        if (
          typeof response.body.resetForm === 'boolean' &&
          response.body.resetForm
        )
          $form.get(0).reset();
        // Redirect
        window.location = response.body.redirectTo;
      } else {
        // Hide the spinner
        spinner.hide();
        // Reset the form
        if (
          typeof response.body.resetForm === 'boolean' &&
          response.body.resetForm
        )
          $form.get(0).reset();
        let config = {};
        config =
          typeof response.body.swal === 'object'
            ? response.body.swal
            : {
                title: isSANB(response.body.title)
                  ? response.body.title
                  : window._types.success,
                type: isSANB(response.body.type)
                  ? response.body.type
                  : 'success',
                html: response.body.message
              };
        // Show message
        await Swal.fire(config);
        // Redirect
        window.location = response.body.redirectTo;
      }
    } else if (typeof response.body.swal === 'object') {
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(response.body.swal);
      // Reset the form
      if (
        typeof response.body.resetForm === 'boolean' &&
        response.body.resetForm
      )
        $form.get(0).reset();
    } else if (isSANB(response.body.message)) {
      // Hide the spinner
      spinner.hide();
      // Reset the form
      if (
        typeof response.body.resetForm === 'boolean' &&
        response.body.resetForm
      )
        $form.get(0).reset();
      // Reload page
      if (
        typeof response.body.reloadPage === 'boolean' &&
        response.body.reloadPage
      ) {
        // Show message
        await Swal.fire(
          window._types.success,
          response.body.message,
          'success'
        );
        window.location.reload();
      } else {
        // Show message
        Swal.fire(window._types.success, response.body.message, 'success');
      }
    } else if (
      typeof response.body.reloadPage === 'boolean' &&
      response.body.reloadPage
    ) {
      window.location.reload();
    } else {
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(
        window._types.success,
        typeof response.body !== 'object' ||
          JSON.stringify(response.body) === '{}'
          ? response.text
          : JSON.stringify(response.body, null, 2),
        'success'
      );
    }

    if (
      typeof response.body === 'object' &&
      response.body !== null &&
      typeof response.body.hideModal === 'boolean' &&
      response.body.hideModal
    ) {
      // bootstrap 3
      $form.parents('.modal.in:first').modal('hide');
      // bootstrap 4
      $form.parents('.modal.show:first').modal('hide');
    }
  } catch (err) {
    // Hide the spinner
    spinner.hide();

    // Show error message
    Swal.fire(window._types.error, err.message, 'error');
  } finally {
    // Re-enable form buttons
    $btns.prop('disabled', false).removeClass('disabled');
  }
};

module.exports = ajaxForm;
