const isSANB = require('is-string-and-not-blank');

const jumpTo = (target, ev) => {
  if (!isSANB(target) || target === '#') {
    // if it does not have an data-target attribute then assume it's scroll top
    if (ev && ev.currentTarget) {
      const $currentTarget = $(ev.currentTarget);
      if (!Object.hasOwn($currentTarget.get(0).dataset, 'target'))
        window.scrollTo(0, 0);
    }

    return;
  }

  const $target = $(target);
  if ($target.length === 0) return;

  // if the target is inside a `.collapse` div without a `.show` class
  // then we shouldn't jump to it (e.g. <h3>)
  const $parentCollapse = $target.parents('.collapse:first');
  if ($parentCollapse.length > 0 && !$parentCollapse.hasClass('show')) {
    // expand the parent collapse if it was hidden
    //
    // NOTE: we do not do `.collapse('show')`
    //       since the transition would be too slow
    //
    $parentCollapse.addClass('show');
  }

  // Remove id and then add it back to prevent scroll
  // <https://stackoverflow.com/a/1489802>
  //
  // Otherwise we could use scrollRestoration History API approach
  // <https://stackoverflow.com/a/58944651>
  // <https://caniuse.com/#feat=mdn-api_history_scrollrestoration>
  //
  const id = $target.attr('id');
  $target.removeAttr('id');
  window.history.replaceState(undefined, undefined, `#${id}`);
  $target.attr('id', id);

  let offsetTop = $target.offset().top;

  if ($('.navbar.fixed-top').length > 0)
    offsetTop -= $('.navbar.fixed-top').outerHeight();

  // add 20px padding to top
  if ($target.prop('tagName') === 'A') offsetTop -= 20;

  window.scrollTo(0, offsetTop);

  // if it had collapse then we need to expand the item
  if ($(`#collapse-${id}`).length > 0) $(`#collapse-${id}`).collapse('show');

  // if there is a scrollspy area then we need to set active state on it
  const $a = $(`a.list-group-item-action`);
  let match = false;
  $a.each(function () {
    if (match) return;
    const $el = $(this);
    if ($el.attr('href') === `#${id}`) {
      match = true;
      $el.parents('.list-group:first').find('a').removeClass('active');
      $el.addClass('active');
    }
  });
};

module.exports = jumpTo;
