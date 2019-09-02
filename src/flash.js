const _ = require('lodash');
const swal = require('sweetalert2');
const isSANB = require('is-string-and-not-blank');

module.exports = () => {
  if (_.isObject(window._messages) && !_.isEmpty(window._messages)) {
    const steps = [];

    _.each(window._messages, (messages, type) => {
      if (messages.length === 0) return;
      _.each(messages, message => {
        if (type === 'custom' && _.isObject(message)) {
          steps.push(message);
        } else if (_.isString(message)) {
          steps.push({
            title:
              _.isObject(window._types) && isSANB(window._types[type])
                ? window._types[type]
                : type,
            html: message,
            type:
              _.isObject(window._types) && isSANB(window._types[type])
                ? type
                : null
          });
        } else {
          console.error('Unknown type of message', message);
        }
      });
    });

    if (steps.length > 0) swal.queue(steps);
  }
};
