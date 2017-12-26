const modalAnchor = function(ev) {
  const target = $(this).data('target');
  if (!target) return true;
  const $target = $(target);
  if (!$target || $target.length === 0) return true;
  ev.preventDefault();
  // auto dismiss open windows before opening the new one
  if ($(this).data('dismiss-modal'))
    $(this)
      .parents('.modal:first')
      .modal('hide');
  $target.modal('show');
};

module.exports = modalAnchor;
