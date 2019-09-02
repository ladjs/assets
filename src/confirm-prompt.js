const swal = require('sweetalert2');
const isSANB = require('is-string-and-not-blank');

// Allow users to specify:
// `data-toggle="confirm-prompt"` or `.confirm-prompt` class
// `data-html="Please confirm if you wish to continue"` html/text of message
// `data-title="Are you sure?"` title of swal message
const confirmPrompt = async ev => {
  // Get the form or button
  const $el = $(ev.currentTarget);

  let title = $el.data('confirm-prompt-title');
  if (!isSANB(title)) title = window._confirmPromptTitle || 'Are you sure?';

  let html = $el.data('confirm-prompt-html');
  if (!isSANB(html))
    html =
      window._confirmPromptHTML || 'Please confirm if you wish to continue.';

  // Check if we've already confirmed it
  const confirmed = $el.data('confirmed');
  if (!confirmed) {
    ev.preventDefault();
    const result = await swal({
      title,
      html,
      type: 'question',
      showCancelButton: true
    });
    if (!result.value) return;
    // Set confirmed state to true
    $el.data('confirmed', true);
    // Trigger click again
    $el.trigger(ev.type);
    // Reset confirmation after click
    $el.data('confirmed', false);
  }
};

module.exports = confirmPrompt;
