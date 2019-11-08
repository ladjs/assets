const jumpTo = require('./jump-to');

// if (window.location.hash !== '') jumpTo($, window.location.hash);
module.exports = () => {
  if (window.location.hash !== '') {
    const { hash } = window.location;
    const $hash = $(window.location.hash);
    if ($hash.length === 0) return;
    $hash.removeAttr('id');
    $(window).load(() => {
      $hash.attr('id', hash.slice(1));
      setTimeout(() => {
        jumpTo(hash);
      }, 1);
    });
  }
};
