// If the page gets resized, and on page load
// detect the height of the top navbar and
// set it as the `padding-top` property of body
const resizeNavbarPadding = ($) => {
  const $navbarFixedTop = $('.navbar.fixed-top');
  if ($navbarFixedTop.length === 0) return;
  $('body').css('padding-top', $navbarFixedTop.outerHeight());
};

module.exports = resizeNavbarPadding;
