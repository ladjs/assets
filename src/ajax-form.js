const Swal = require('sweetalert2');
const _ = require('lodash');
const isSANB = require('is-string-and-not-blank');
const qs = require('qs');
const superagent = require('superagent');

const Spinner = require('./spinner');

// Ajax form submission with frisbee
// and sweetalert2 message response
// and built-in support for Stripe Checkout
// eslint-disable-next-line complexity
const ajaxForm = async ev => {
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
    if (!window.StripeCheckout) return console.error('Stripe checkout missing');

    // Lookup email input for later
    const $email = $form.find('input[name="stripe_email"]');

    // If there is already a token then continue
    const $token = $form.find('input[name="stripe_token"]');

    if ($token.length === 0) return console.error('Missing Stripe token field');

    if ($token.val() === '') {
      // Fetch token for the user
      const handler = window.StripeCheckout.configure({
        key: window.STRIPE_PUBLISHABLE_KEY,
        image: window.STRIPE_CHECKOUT_IMAGE_URL,
        locale: window.LOCALE || 'auto',
        token: token => {
          // You can access the token ID with `token.id`.
          // get the token ID to your server-side code for use
          $token.val(token.id);
          // Also included is `token.email`
          // which we append to the form if
          // there is an `input[name=email]`
          if ($email.length !== 0) $email.val(token.email);
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
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      Expires: '-1',
      'Cache-Control': 'no-cache,no-store,must-revalidate,max-age=-1,private'
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

    // Send the request
    const res = await superagent[method.toLowerCase()](action)
      .set(headers)
      .ok(() => true) // override so we can parse it ourselves
      .send(body);

    // taken from Frisbee
    // attempt to use better and human-friendly error messages
    if (!res.ok) {
      res.err = new Error(
        res.statusText || res.text || 'Unsuccessful HTTP response'
      );
      if (
        typeof res.body === 'object' &&
        typeof res.body.message === 'string'
      ) {
        res.err = new Error(res.body.message);
      } else if (
        !Array.isArray(res.body) &&
        // attempt to utilize Stripe-inspired error messages
        typeof res.body.error === 'object'
      ) {
        if (res.body.error.message) res.err = new Error(res.body.error.message);
        if (res.body.error.stack) res.err.stack = res.body.error.stack;
        if (res.body.error.code) res.err.code = res.body.error.code;
        if (res.body.error.param) res.err.param = res.body.error.param;
      }
    }

    // Check if any errors occurred
    if (res.err) throw res.err;

    // Either display a success message, redirect user, or reload page
    if (!_.isObject(res.body)) {
      console.error('Response was not an object', res);
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(
        window._types.error,
        'Invalid response, please try again',
        'error'
      );
    } else if (isSANB(res.body.redirectTo)) {
      if (
        (_.isBoolean(res.body.autoRedirect) && res.body.autoRedirect) ||
        (!isSANB(res.body.message) && !_.isObject(res.body.swal))
      ) {
        // Reset the form
        if (_.isBoolean(res.body.resetForm) && res.body.resetForm)
          $form.get(0).reset();
        // Redirect
        window.location = res.body.redirectTo;
      } else {
        // Hide the spinner
        spinner.hide();
        // Reset the form
        if (_.isBoolean(res.body.resetForm) && res.body.resetForm)
          $form.get(0).reset();
        let config = {};
        if (_.isObject(res.body.swal)) config = res.body.swal;
        else
          config = {
            title: isSANB(res.body.title)
              ? res.body.title
              : window._types.success,
            type: 'success',
            html: res.body.message
          };
        // Show message
        await Swal.fire(config);
        // Redirect
        window.location = res.body.redirectTo;
      }
    } else if (_.isObject(res.body.swal)) {
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(res.body.swal);
      // Reset the form
      if (_.isBoolean(res.body.resetForm) && res.body.resetForm)
        $form.get(0).reset();
    } else if (isSANB(res.body.message)) {
      // Hide the spinner
      spinner.hide();
      // Reset the form
      if (_.isBoolean(res.body.resetForm) && res.body.resetForm)
        $form.get(0).reset();
      // Reload page
      if (_.isBoolean(res.body.reloadPage) && res.body.reloadPage) {
        // Show message
        await Swal.fire(window._types.success, res.body.message, 'success');
        window.location.reload();
      } else {
        // Show message
        Swal.fire(window._types.success, res.body.message, 'success');
      }
    } else if (_.isBoolean(res.body.reloadPage) && res.body.reloadPage) {
      window.location.reload();
    } else {
      // Hide the spinner
      spinner.hide();
      // Show message
      Swal.fire(
        window._types.success,
        JSON.stringify(res.body, null, 2),
        'success'
      );
    }

    if (_.isBoolean(res.body.hideModal) && res.body.hideModal) {
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
