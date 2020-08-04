const Swal = require('sweetalert2');
const isSANB = require('is-string-and-not-blank');

module.exports = () => {
  if (typeof window._messages === 'object') {
    const steps = [];
    for (const type of Object.keys(window._messages)) {
      const messages = window._messages[type];
      if (messages.length === 0) continue;
      for (const message of messages) {
        if (type === 'custom' && typeof message === 'object') {
          steps.push(message);
        } else if (typeof message === 'string') {
          steps.push({
            title:
              typeof window._types === 'object' && isSANB(window._types[type])
                ? window._types[type]
                : type,
            html: message,
            type:
              typeof window._types === 'object' && isSANB(window._types[type])
                ? type
                : null
          });
        } else {
          const err = new Error(`Unknown message type of "${message}".`);
          // eslint-disable-next-line max-depth
          if (
            typeof window.cabin === 'object' &&
            typeof window.cabin.error === 'function'
          )
            window.cabin.error(err);
          else console.error(err);
        }
      }
    }

    if (steps.length > 0) Swal.queue(steps);
  }
};
