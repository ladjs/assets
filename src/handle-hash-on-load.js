const jumpTo = require('./jump-to.js');

// if (window.location.hash !== '') jumpTo($, window.location.hash);
module.exports = () => {
  if (window.location.hash !== '') {
    try {
      const { hash } = window.location;
      const $hash = $(window.location.hash);
      if ($hash.length === 0) return;
      $hash.removeAttr('id');
      $(window).on('load', () => {
        $hash.attr('id', hash.slice(1));
        setTimeout(() => {
          jumpTo(hash);
        }, 1);
      });
    } catch (err) {
      if (
        typeof window.cabin === 'object' &&
        typeof window.cabin.warn === 'function'
      )
        window.cabin.warn(err);
      else console.warn(err);
    }
  }
};
