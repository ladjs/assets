const Swal = require('sweetalert2/dist/sweetalert2');
const isSANB = require('is-string-and-not-blank');

// Allow users to specify:
// `data-toggle="confirm-prompt"` or `.confirm-prompt` class
// `data-html="Please confirm if you wish to continue"` html/text of message
// `data-title="Are you sure?"` title of swal message
const confirmPrompt = async (ev) => {
  // Get the form or button
  const $element = $(ev.currentTarget);

  let title = $element.data('confirm-prompt-title');
  if (!isSANB(title)) title = window._confirmPromptTitle || 'Are you sure?';

  let html = $element.data('confirm-prompt-html');
  if (!isSANB(html))
    html =
      window._confirmPromptHTML || 'Please confirm if you wish to continue.';

  // Check if we've already confirmed it
  const confirmed = $element.data('confirmed');
  if (!confirmed) {
    ev.preventDefault();
    const result = await Swal.fire({
      title,
      html,
      type: 'question',
      showCancelButton: true
    });
    if (!result.value) return;
    // Set confirmed state to true
    $element.data('confirmed', true);
    // Trigger click again
    $element.trigger(ev.type);
    // Reset confirmation after click
    $element.data('confirmed', false);
  }
};

module.exports = confirmPrompt;
