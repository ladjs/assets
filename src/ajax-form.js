const Swal = require('sweetalert2');
const URL = require('url-parse');
const isSANB = require('is-string-and-not-blank');
const qs = require('qs');
const superagent = require('superagent');

const Spinner = require('./spinner.js');

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

  // Const api = new Frisbee({
  //   baseURI: window.location.origin,
  //   headers: defaultHeaders
  // });

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
  let action = $form.is('a') ? $form.attr('href') : $form.attr('action');

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
      'X-Requested-With': 'XMLHttpRequest'
    };

    // If the form contains a file input, then we need to use FormData
    // otherwise we can just use querystring parsing to assemble body
    let body = {};

    if ($form.find('input[type="file"]').length > 0) {
      body = new FormData(this);
      // Delete _csrf and _method from the body
      // since they are defined in headers and http method
      body.delete('_csrf');
      body.delete('_method');
      // Remove content-type header so boundary is added for multipart forms
      // http://stackoverflow.com/a/35799817
      headers['Content-Type'] = undefined;
      delete headers['Content-Type'];
    } else {
      body = qs.parse($form.serialize());
      // Delete _csrf and _method from the body
      // since they are defined in headers and http method
      delete body._csrf;
      delete body._method;
    }

    // Update the querystring for ajax tables
    if ($form.hasClass('table-ajax-form')) {
      const url = new URL(window.location.href);

      // Create state
      let state = qs.parse(url.query, {
        ignoreQueryPrefix: true
      });

      const pageNumber = $form.data('page');
      if (pageNumber) {
        state.page = pageNumber;
      }

      // Data search-params should be a ',' delimited string
      let searchParameters = $form.data('search-params');
      searchParameters = isSANB(searchParameters)
        ? searchParameters.split(',')
        : [];

      // Determine if states are the same
      let isSameState = Boolean(window.history.state);

      for (const key of searchParameters) {
        const value = body instanceof FormData ? body.get(key) : body[key];

        // Set page number to undefined if key has changed
        const isSame = state[key] === value;
        state.page = isSame ? state.page : undefined;

        state[key] = isSANB(value)
          ? value
          : value === ''
          ? undefined
          : state[key];

        if (isSameState && !isSame) isSameState = false;
      }

      // Security check to prevent _csrf ever being added to querystring
      if (state._csrf) delete state._csrf;

      state = qs.stringify(state);
      url.set('query', state);

      // Remove undefined properties
      state = isSANB(state) ? qs.parse(state) : undefined;

      if (isSameState || !state) {
        window.history.replaceState(
          state,
          `state ${window.history.length}`,
          url.toString()
        );
      } else {
        window.history.pushState(
          state,
          `state ${window.history.length}`,
          url.toString()
        );
      }

      // Add the refactored querystring to action
      action = url.toString();
    }

    // NOTE: this does not support retries/timeout yet
    // Send the request
    const response = await superagent[method.toLowerCase()](action)
      .set(headers)
      .ok(() => true) // Override so we can parse it ourselves
      .send(body);

    // Taken from Frisbee
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
        // Attempt to utilize Stripe-inspired error messages
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
      } else if (
        typeof response.body.renderModalBodyWithHTML === 'boolean' &&
        response.body.renderModalBodyWithHTML
      ) {
        $form
          .parents('.modal.show:first')
          .find('.modal-body')
          .html(response.body.message);
      } else {
        // Show message
        Swal.fire(window._types.success, response.body.message, 'success');
      }
    } else if (
      typeof response.body.reloadPage === 'boolean' &&
      response.body.reloadPage
    ) {
      window.location.reload();
    } else if (
      $form.hasClass('table-ajax-form') &&
      isSANB(response.body.table)
    ) {
      // Reload table
      const tableSelector = $form.data('table');

      const $table = $(tableSelector);

      $table.html(response.body.table);

      // dispatch an event so we can re-render things (e.g. dayjs)
      $form.dispatchEvent(new Event('reload'));

      spinner.hide();
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
      // Bootstrap 3
      $form.parents('.modal.in:first').modal('hide');
      // Bootstrap 4
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
