const Clipboard = require('clipboard');

module.exports = () => {
  function errorHandler(ev) {
    ev.clearSelection();
    const key = ev.action === 'cut' ? 'X' : 'C';
    let title = `Press <kbd>CTRL-${key}</kbd> to ${ev.action}`;

    if (/iphone|ipad/i.test(navigator.userAgent)) {
      title = 'No clipboard support, sorry!';
    } else if (/mac/i.test(navigator.userAgent)) {
      title = `Press <kbd>⌘-${key}</kbd> to ${ev.action}`;
    }

    $(ev.trigger)
      .tooltip({
        title,
        html: true,
        placement: 'bottom'
      })
      .tooltip('show');
    $(ev.trigger).on('hidden.bs.tooltip', () =>
      $(ev.trigger).tooltip('dispose')
    );
  }

  function successHandler(ev) {
    ev.clearSelection();
    $(ev.trigger)
      .tooltip({
        title: 'Copied!',
        placement: 'bottom'
      })
      .tooltip('show');
    $(ev.trigger).on('hidden.bs.tooltip', () => {
      $(ev.trigger).tooltip('dispose');
    });
  }

  // Handle clipboard copy helper buttons
  if (Clipboard.isSupported()) {
    const clipboard = new Clipboard('[data-toggle="clipboard"]', {});
    clipboard.on('success', successHandler);
    clipboard.on('error', errorHandler);
  } else {
    $('[data-toggle-clipboard]').addClass('hidden');
  }

  return Clipboard;
};
