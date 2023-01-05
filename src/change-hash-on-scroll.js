// Handle hashes when page scrolls
// <https://stackoverflow.com/a/5315993>
const changeHashOnScroll = () => {
  // If we're at the top of the page then remove the hash
  if (window.pageYOffset === 0)
    return window.history.replaceState(
      undefined,
      undefined,
      window.location.pathname + window.location.search
    );

  const $navbarFixedTop = $('.navbar.fixed-top');
  const extraHeight =
    $navbarFixedTop.length === 0 ? 0 : $navbarFixedTop.outerHeight();
  const $target = window.location.hash === '' ? null : $(window.location.hash);

  $('[id]:visible:not(:input, button, .navbar-collapse)')
    .not($target)
    .each(function () {
      const beginsBeforeTop =
        $(this).offset().top < window.pageYOffset + extraHeight;
      const endsInVisibleArea =
        $(this).offset().top + $(this).height() >
        window.pageYOffset + extraHeight;
      if (!beginsBeforeTop || !endsInVisibleArea) return;
      // Remove id and then add it back to prevent scroll
      // <https://stackoverflow.com/a/1489802>
      const id = $(this).attr('id');
      // Exclude Svgjs and apexcharts
      if (
        id === 'top' ||
        id.startsWith('Svgjs') ||
        id.startsWith('apexcharts') ||
        id.startsWith('lazyframe') ||
        id.startsWith('modal-')
      )
        return;
      $(this).removeAttr('id');
      window.history.replaceState(undefined, undefined, `#${id}`);
      $(this).attr('id', id);

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
    });
};

module.exports = changeHashOnScroll;
